using System.Collections.Generic;
using UnityEngine;

public class PoliceChaseManager : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private float lingerRadius = 24f;
    [SerializeField] private float firstBackupDelay = 6f;
    [SerializeField] private float backupSpawnInterval = 4.5f;
    [SerializeField] private int maxPoliceCars = 8;
    [SerializeField] private float initialSpawnDelay = 3f;
    [SerializeField] private float initialSpawnMinDistance = 58f;
    [SerializeField] private float spawnDistance = 74f;
    [SerializeField] private float despawnDistance = 145f;

    private readonly List<PoliceCarAI> policeCars = new List<PoliceCarAI>();
    private Vector3 lingerAnchor;
    private float initialSpawnTimer;
    private float lingerTimer;
    private float nextSpawnTimer;
    private bool initialPoliceSpawned;
    private int spawnIndex;

    public static PoliceChaseManager EnsureExists(Transform target)
    {
        PoliceChaseManager manager = FindFirstObjectByType<PoliceChaseManager>();
        if (manager == null)
        {
            GameObject managerObject = new GameObject("Police Chase Manager");
            manager = managerObject.AddComponent<PoliceChaseManager>();
        }

        manager.SetTarget(target);
        return manager;
    }

    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
        if (target == null)
        {
            return;
        }

        lingerAnchor = target.position;
        lingerTimer = 0f;
        initialSpawnTimer = initialSpawnDelay;
        nextSpawnTimer = firstBackupDelay;
        initialPoliceSpawned = false;
        RemoveExistingPoliceAtStart();
    }

    private void Update()
    {
        if (target == null)
        {
            return;
        }

        TrySpawnInitialPolice();
        RegisterExistingPolice();
        RemoveFarPolice();
        UpdateLingerTimer();
        TrySpawnBackup();
    }

    private void TrySpawnInitialPolice()
    {
        if (initialPoliceSpawned)
        {
            return;
        }

        initialSpawnTimer -= Time.deltaTime;
        if (initialSpawnTimer > 0f)
        {
            return;
        }

        initialPoliceSpawned = true;
        SpawnPolice(GetRandomInitialSpawnOffset(), Vector3.zero, false);
    }

    private Vector3 GetRandomInitialSpawnOffset()
    {
        Vector2 randomCircle = Random.insideUnitCircle.normalized;
        if (randomCircle.sqrMagnitude < 0.01f)
        {
            randomCircle = Vector2.up;
        }

        float distance = Random.Range(initialSpawnMinDistance, spawnDistance);
        return new Vector3(randomCircle.x * distance, 0f, randomCircle.y * distance);
    }

    private void RegisterExistingPolice()
    {
        PoliceCarAI[] existingPolice = FindObjectsByType<PoliceCarAI>(FindObjectsSortMode.None);
        foreach (PoliceCarAI police in existingPolice)
        {
            if (police == null || policeCars.Contains(police))
            {
                continue;
            }

            police.SetTarget(target);
            police.SetPersonality(GetRandomPersonality(false));
            MiniGTABootstrap.EnsurePoliceVisual(police.gameObject);
            policeCars.Add(police);
        }
    }

    private void UpdateLingerTimer()
    {
        Vector3 flatTarget = target.position;
        flatTarget.y = 0f;
        Vector3 flatAnchor = lingerAnchor;
        flatAnchor.y = 0f;

        if (Vector3.Distance(flatTarget, flatAnchor) > lingerRadius)
        {
            lingerAnchor = target.position;
            lingerTimer = 0f;
            nextSpawnTimer = firstBackupDelay;
            return;
        }

        lingerTimer += Time.deltaTime;
        nextSpawnTimer -= Time.deltaTime;
    }

    private void TrySpawnBackup()
    {
        if (lingerTimer < firstBackupDelay || nextSpawnTimer > 0f || policeCars.Count >= maxPoliceCars)
        {
            return;
        }

        Vector3 spawnDirection = GetSpawnDirection();
        Vector3 spawnOffset = spawnDirection * spawnDistance;
        Vector3 surroundOffset = GetSurroundOffset();
        SpawnPolice(spawnOffset, surroundOffset, true);

        float pressure = Mathf.Clamp01(lingerTimer / 28f);
        nextSpawnTimer = Mathf.Lerp(backupSpawnInterval, 1.6f, pressure);
    }

    private Vector3 GetSpawnDirection()
    {
        Vector3[] directions =
        {
            target.forward,
            -target.forward,
            target.right,
            -target.right,
            (target.forward + target.right).normalized,
            (target.forward - target.right).normalized,
            (-target.forward + target.right).normalized,
            (-target.forward - target.right).normalized
        };

        Vector3 direction = directions[spawnIndex % directions.Length];
        spawnIndex++;
        direction.y = 0f;
        return direction.sqrMagnitude > 0.01f ? direction.normalized : Vector3.forward;
    }

    private Vector3 GetSurroundOffset()
    {
        Vector3[] offsets =
        {
            Vector3.zero,
            new Vector3(4f, 0f, 0f),
            new Vector3(-4f, 0f, 0f),
            new Vector3(0f, 0f, 5f),
            new Vector3(0f, 0f, -4f),
            new Vector3(6f, 0f, 5f),
            new Vector3(-6f, 0f, 5f),
            new Vector3(0f, 0f, -6f)
        };

        return offsets[spawnIndex % offsets.Length];
    }

    private void SpawnPolice(Vector3 spawnOffset, Vector3 surroundOffset, bool backup)
    {
        Vector3 spawnPosition = target.position + spawnOffset;
        spawnPosition.y = 0.1f;

        GameObject policeObject = MiniGTABootstrap.CreatePoliceCarForChase(target, spawnPosition, surroundOffset);
        PoliceCarAI police = policeObject.GetComponent<PoliceCarAI>();
        if (police != null && !policeCars.Contains(police))
        {
            police.SetPersonality(GetRandomPersonality(backup));
            MiniGTABootstrap.EnsurePoliceVisual(police.gameObject);
            policeCars.Add(police);
        }
    }

    private void RemoveExistingPoliceAtStart()
    {
        PoliceCarAI[] existingPolice = FindObjectsByType<PoliceCarAI>(FindObjectsSortMode.None);
        foreach (PoliceCarAI police in existingPolice)
        {
            if (police != null)
            {
                Destroy(police.gameObject);
            }
        }

        policeCars.Clear();
    }

    private PoliceCarAI.DrivingPersonality GetRandomPersonality(bool backup)
    {
        float roll = Random.value;

        if (!backup)
        {
            if (roll < 0.35f)
            {
                return PoliceCarAI.DrivingPersonality.Calm;
            }

            if (roll < 0.85f)
            {
                return PoliceCarAI.DrivingPersonality.Balanced;
            }

            return PoliceCarAI.DrivingPersonality.Aggressive;
        }

        if (roll < 0.22f)
        {
            return PoliceCarAI.DrivingPersonality.Calm;
        }

        if (roll < 0.62f)
        {
            return PoliceCarAI.DrivingPersonality.Balanced;
        }

        return PoliceCarAI.DrivingPersonality.Aggressive;
    }

    private void RemoveFarPolice()
    {
        for (int i = policeCars.Count - 1; i >= 0; i--)
        {
            PoliceCarAI police = policeCars[i];
            if (police == null)
            {
                policeCars.RemoveAt(i);
                continue;
            }

            if (police.DistanceToTarget > despawnDistance)
            {
                Destroy(police.gameObject);
                policeCars.RemoveAt(i);
            }
        }
    }
}
