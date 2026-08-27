using System;
using System.Collections.Generic;
using Photon.Client;
using Photon.Realtime;
using UnityEngine;

public class SimplePhotonMultiplayer : MonoBehaviour, IConnectionCallbacks, IMatchmakingCallbacks, IInRoomCallbacks, IOnEventCallback
{
    private const byte CarStateEvent = 1;
    private const string DefaultAppId = "51f30cd4-a82e-407a-bf67-103ec43d6f8d";

    [SerializeField] private ArcadeCarController localCar;
    [SerializeField] private float sendRate = 0.08f;

    private readonly Dictionary<int, RemotePlayerCar> remoteCars = new Dictionary<int, RemotePlayerCar>();
    private RealtimeClient client;
    private string pendingRoomName;
    private string status = "Offline";
    private float sendTimer;
    private bool connecting;

    public string Status => status;
    public bool IsInRoom => client != null && client.InRoom;

    public static SimplePhotonMultiplayer EnsureExists(ArcadeCarController localCar)
    {
        SimplePhotonMultiplayer multiplayer = FindFirstObjectByType<SimplePhotonMultiplayer>();
        if (multiplayer == null)
        {
            GameObject multiplayerObject = new GameObject("Simple Photon Multiplayer");
            DontDestroyOnLoad(multiplayerObject);
            multiplayer = multiplayerObject.AddComponent<SimplePhotonMultiplayer>();
        }

        multiplayer.SetLocalCar(localCar);
        return multiplayer;
    }

    public void SetLocalCar(ArcadeCarController newLocalCar)
    {
        localCar = newLocalCar;
    }

    public void JoinOrCreateRoom(string roomName)
    {
        pendingRoomName = string.IsNullOrWhiteSpace(roomName) ? "koulu" : roomName.Trim().ToLowerInvariant();

        if (client != null && client.InRoom)
        {
            status = "Already in room: " + client.CurrentRoom.Name;
            return;
        }

        if (client != null && client.IsConnectedAndReady)
        {
            JoinPendingRoom();
            return;
        }

        Connect();
    }

    public void LeaveRoom()
    {
        if (client != null && client.InRoom)
        {
            client.OpLeaveRoom(false);
        }

        ClearRemoteCars();
        status = "Left multiplayer";
    }

    private void Awake()
    {
        DontDestroyOnLoad(gameObject);
    }

    private void Update()
    {
        client?.Service();

        if (client == null || !client.InRoom || localCar == null)
        {
            return;
        }

        sendTimer -= Time.unscaledDeltaTime;
        if (sendTimer <= 0f)
        {
            sendTimer = sendRate;
            SendLocalCarState();
        }
    }

    private void OnDestroy()
    {
        if (client != null)
        {
            client.RemoveCallbackTarget(this);
            client.Disconnect();
        }
    }

    private void Connect()
    {
        if (connecting)
        {
            return;
        }

        connecting = true;
        status = "Connecting...";
        client = new RealtimeClient(GetBestProtocol());
        client.AddCallbackTarget(this);
        AppSettings settings = new AppSettings
        {
            AppIdFusion = DefaultAppId,
            AppVersion = "mini-gta-0.1",
            FixedRegion = "eu",
            Protocol = GetBestProtocol()
        };

        client.ConnectUsingSettings(settings);
    }

    private static ConnectionProtocol GetBestProtocol()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        return ConnectionProtocol.WebSocketSecure;
#else
        return ConnectionProtocol.Udp;
#endif
    }

    private void JoinPendingRoom()
    {
        if (client == null)
        {
            return;
        }

        status = "Joining room: " + pendingRoomName;
        RoomOptions options = new RoomOptions
        {
            MaxPlayers = 8,
            IsVisible = false,
            IsOpen = true,
            CleanupCacheOnLeave = true
        };

        client.OpJoinOrCreateRoom(new EnterRoomArgs
        {
            RoomName = pendingRoomName,
            RoomOptions = options
        });
    }

    private void SendLocalCarState()
    {
        Transform carTransform = localCar.transform;
        object[] payload =
        {
            carTransform.position.x,
            carTransform.position.y,
            carTransform.position.z,
            carTransform.rotation.eulerAngles.y
        };

        client.OpRaiseEvent(
            CarStateEvent,
            payload,
            new RaiseEventArgs { Receivers = ReceiverGroup.Others },
            SendOptions.SendUnreliable);
    }

    public void OnEvent(EventData photonEvent)
    {
        object[] payload = photonEvent.CustomData as object[];
        if (photonEvent.Code != CarStateEvent || payload == null || payload.Length < 4)
        {
            return;
        }

        int actorNumber = photonEvent.Sender;
        if (actorNumber == client.LocalPlayer.ActorNumber)
        {
            return;
        }

        Vector3 position = new Vector3(Convert.ToSingle(payload[0]), Convert.ToSingle(payload[1]), Convert.ToSingle(payload[2]));
        Quaternion rotation = Quaternion.Euler(0f, Convert.ToSingle(payload[3]), 0f);
        RemotePlayerCar remoteCar = GetOrCreateRemoteCar(actorNumber, position, rotation);
        remoteCar.SetState(position, rotation);
    }

    private RemotePlayerCar GetOrCreateRemoteCar(int actorNumber, Vector3 position, Quaternion rotation)
    {
        if (remoteCars.TryGetValue(actorNumber, out RemotePlayerCar remoteCar) && remoteCar != null)
        {
            return remoteCar;
        }

        GameObject car = MiniGTABootstrap.CreateRemoteCarVisual(position, rotation);
        remoteCar = car.AddComponent<RemotePlayerCar>();
        remoteCars[actorNumber] = remoteCar;
        return remoteCar;
    }

    private void ClearRemoteCars()
    {
        foreach (RemotePlayerCar remoteCar in remoteCars.Values)
        {
            if (remoteCar != null)
            {
                Destroy(remoteCar.gameObject);
            }
        }

        remoteCars.Clear();
    }

    public void OnConnected()
    {
    }

    public void OnConnectedToMaster()
    {
        connecting = false;
        status = "Connected";
        JoinPendingRoom();
    }

    public void OnDisconnected(DisconnectCause cause)
    {
        connecting = false;
        status = "Disconnected: " + cause;
        ClearRemoteCars();
    }

    public void OnRegionListReceived(RegionHandler regionHandler)
    {
    }

    public void OnCustomAuthenticationResponse(Dictionary<string, object> data)
    {
    }

    public void OnCustomAuthenticationFailed(string debugMessage)
    {
        connecting = false;
        status = "Auth failed: " + debugMessage;
    }

    public void OnCreatedRoom()
    {
    }

    public void OnCreateRoomFailed(short returnCode, string message)
    {
        connecting = false;
        status = "Create failed: " + message;
    }

    public void OnJoinedRoom()
    {
        status = "Room: " + client.CurrentRoom.Name + " (" + client.CurrentRoom.PlayerCount + "/8)";
    }

    public void OnJoinRoomFailed(short returnCode, string message)
    {
        connecting = false;
        status = "Join failed: " + message;
    }

    public void OnJoinRandomFailed(short returnCode, string message)
    {
    }

    public void OnLeftRoom()
    {
        status = "Connected";
        ClearRemoteCars();
    }

    public void OnFriendListUpdate(List<FriendInfo> friendList)
    {
    }

    public void OnPlayerEnteredRoom(Player newPlayer)
    {
        status = "Room: " + client.CurrentRoom.Name + " (" + client.CurrentRoom.PlayerCount + "/8)";
    }

    public void OnPlayerLeftRoom(Player otherPlayer)
    {
        if (remoteCars.TryGetValue(otherPlayer.ActorNumber, out RemotePlayerCar remoteCar) && remoteCar != null)
        {
            Destroy(remoteCar.gameObject);
        }

        remoteCars.Remove(otherPlayer.ActorNumber);
        if (client != null && client.CurrentRoom != null)
        {
            status = "Room: " + client.CurrentRoom.Name + " (" + client.CurrentRoom.PlayerCount + "/8)";
        }
    }

    public void OnRoomPropertiesUpdate(PhotonHashtable propertiesThatChanged)
    {
    }

    public void OnPlayerPropertiesUpdate(Player targetPlayer, PhotonHashtable changedProps)
    {
    }

    public void OnMasterClientSwitched(Player newMasterClient)
    {
    }
}
