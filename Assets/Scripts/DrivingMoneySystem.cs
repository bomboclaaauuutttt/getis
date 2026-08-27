using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
#endif

public class DrivingMoneySystem : MonoBehaviour
{
    [SerializeField] private ArcadeCarController playerCar;
    [SerializeField] private float speedRewardThreshold = 0.72f;
    [SerializeField] private float speedMoneyPerSecond = 8f;
    [SerializeField] private float driftMoneyPerSecond = 18f;
    [SerializeField] private float minimumDriftSideSpeed = 3.2f;

    private Rigidbody playerRb;
    private Text moneyText;
    private Text gainText;
    private float money;
    private float recentGain;
    private float recentGainTimer;

    public static DrivingMoneySystem EnsureExists(ArcadeCarController playerCar)
    {
        DrivingMoneySystem system = FindFirstObjectByType<DrivingMoneySystem>();
        if (system == null)
        {
            GameObject systemObject = new GameObject("Driving Money System");
            system = systemObject.AddComponent<DrivingMoneySystem>();
        }

        system.SetPlayer(playerCar);
        return system;
    }

    public void SetPlayer(ArcadeCarController newPlayerCar)
    {
        playerCar = newPlayerCar;
        playerRb = playerCar != null ? playerCar.GetComponent<Rigidbody>() : null;
    }

    private void Awake()
    {
        BuildUI();
    }

    private void Update()
    {
        if (playerCar == null || playerRb == null)
        {
            return;
        }

        float earned = CalculateSpeedReward() + CalculateDriftReward();
        if (earned > 0f)
        {
            money += earned;
            recentGain += earned;
            recentGainTimer = 0.85f;
        }

        if (recentGainTimer > 0f)
        {
            recentGainTimer -= Time.deltaTime;
        }
        else
        {
            recentGain = Mathf.Lerp(recentGain, 0f, 1f - Mathf.Exp(-6f * Time.deltaTime));
        }

        UpdateUI();
    }

    private float CalculateSpeedReward()
    {
        float speedPercent = playerCar.SpeedPercent;
        if (speedPercent < speedRewardThreshold)
        {
            return 0f;
        }

        float fastAmount = Mathf.InverseLerp(speedRewardThreshold, 1f, speedPercent);
        return fastAmount * speedMoneyPerSecond * Time.deltaTime;
    }

    private float CalculateDriftReward()
    {
        Vector3 velocity = playerRb.linearVelocity;
        velocity.y = 0f;

        float sideSpeed = Mathf.Abs(Vector3.Dot(velocity, playerCar.transform.right));
        float forwardSpeed = Mathf.Abs(Vector3.Dot(velocity, playerCar.transform.forward));
        if (sideSpeed < minimumDriftSideSpeed || forwardSpeed < 4f)
        {
            return 0f;
        }

        float driftAngle = Vector3.Angle(playerCar.transform.forward, velocity.normalized);
        float angleReward = Mathf.InverseLerp(12f, 48f, driftAngle);
        float sideReward = Mathf.InverseLerp(minimumDriftSideSpeed, 9f, sideSpeed);
        return angleReward * sideReward * driftMoneyPerSecond * Time.deltaTime;
    }

    private void UpdateUI()
    {
        if (moneyText != null)
        {
            moneyText.text = "$" + Mathf.FloorToInt(money).ToString();
        }

        if (gainText == null)
        {
            return;
        }

        bool showingGain = recentGain > 0.35f;
        gainText.text = showingGain ? "+$" + Mathf.FloorToInt(recentGain).ToString() : "";
        Color color = gainText.color;
        color.a = showingGain ? Mathf.Clamp01(recentGainTimer / 0.85f) : 0f;
        gainText.color = color;
    }

    private void BuildUI()
    {
        EnsureEventSystem();

        Canvas canvas = gameObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 75;

        CanvasScaler scaler = gameObject.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920f, 1080f);
        scaler.matchWidthOrHeight = 0.5f;

        gameObject.AddComponent<GraphicRaycaster>();

        moneyText = CreateText("Money", new Vector2(42f, -36f), new Vector2(300f, 70f), 36, FontStyle.Bold, TextAnchor.MiddleLeft);
        gainText = CreateText("Money Gain", new Vector2(44f, -92f), new Vector2(250f, 54f), 26, FontStyle.Bold, TextAnchor.MiddleLeft);
        gainText.color = new Color(0.62f, 1f, 0.42f, 0f);
        UpdateUI();
    }

    private Text CreateText(string objectName, Vector2 anchoredPosition, Vector2 size, int fontSize, FontStyle style, TextAnchor alignment)
    {
        GameObject textObject = new GameObject(objectName);
        textObject.transform.SetParent(transform, false);

        RectTransform rect = textObject.AddComponent<RectTransform>();
        rect.anchorMin = new Vector2(0f, 1f);
        rect.anchorMax = new Vector2(0f, 1f);
        rect.pivot = new Vector2(0f, 1f);
        rect.anchoredPosition = anchoredPosition;
        rect.sizeDelta = size;

        Text text = textObject.AddComponent<Text>();
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        text.fontSize = fontSize;
        text.fontStyle = style;
        text.alignment = alignment;
        text.color = Color.white;
        text.resizeTextForBestFit = true;
        text.resizeTextMinSize = 16;
        text.resizeTextMaxSize = fontSize;
        return text;
    }

    private static void EnsureEventSystem()
    {
        if (FindFirstObjectByType<EventSystem>() != null)
        {
            return;
        }

        GameObject eventSystemObject = new GameObject("EventSystem");
        eventSystemObject.AddComponent<EventSystem>();
#if ENABLE_INPUT_SYSTEM
        InputSystemUIInputModule inputModule = eventSystemObject.AddComponent<InputSystemUIInputModule>();
        InputActionAsset actions = ScriptableObject.CreateInstance<InputActionAsset>();
        InputActionMap ui = new InputActionMap("UI");

        InputAction point = ui.AddAction("Point", InputActionType.PassThrough, "<Pointer>/position");
        InputAction click = ui.AddAction("Click", InputActionType.PassThrough, "<Pointer>/press");
        InputAction submit = ui.AddAction("Submit", InputActionType.Button, "<Keyboard>/enter");
        submit.AddBinding("<Keyboard>/space");

        actions.AddActionMap(ui);
        actions.Enable();

        inputModule.actionsAsset = actions;
        inputModule.point = InputActionReference.Create(point);
        inputModule.leftClick = InputActionReference.Create(click);
        inputModule.submit = InputActionReference.Create(submit);
#else
        eventSystemObject.AddComponent<StandaloneInputModule>();
#endif
    }
}
