using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class TrafficCarAI : MonoBehaviour
{
    public enum TrafficPersonality
    {
        Grandma,
        Normal,
        Drunk
    }

    [SerializeField] private float speed = 8f;
    [SerializeField] private float turnSpeed = 100f;
    [SerializeField] private float roadWidth = 9f;
    [SerializeField] private float chunkSize = 96f;
    [SerializeField] private TrafficPersonality personality = TrafficPersonality.Normal;

    private Rigidbody rb;
    private Transform player;
    private Vector3 driveDirection = Vector3.forward;
    private float wobbleSeed;
    private float swerveTimer;
    private float swerveCooldown;

    public void Configure(Vector3 direction, float newSpeed, float newRoadWidth, float newChunkSize, Transform playerTarget, TrafficPersonality newPersonality)
    {
        driveDirection = direction.sqrMagnitude > 0.01f ? direction.normalized : Vector3.forward;
        player = playerTarget;
        personality = newPersonality;
        speed = newSpeed;
        roadWidth = newRoadWidth;
        chunkSize = newChunkSize;
        ApplyPersonality();
        transform.rotation = Quaternion.LookRotation(driveDirection, Vector3.up);
    }

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
        rb.mass = 820f;
        rb.linearDamping = 0.8f;
        rb.angularDamping = 5f;
        rb.interpolation = RigidbodyInterpolation.Interpolate;
        rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;
        wobbleSeed = Random.Range(0f, 1000f);
        swerveCooldown = Random.Range(1.5f, 4.5f);
    }

    private void FixedUpdate()
    {
        FollowRoad();
    }

    private void FollowRoad()
    {
        Vector3 position = transform.position;
        Vector3 center = GetCurrentRoadCenter(position);
        Vector3 toCenter = center - position;
        toCenter.y = 0f;

        Vector3 desiredDirection = driveDirection + toCenter * GetCenteringStrength();
        desiredDirection += transform.right * GetLaneWobble();
        desiredDirection += GetPlayerSwerveDirection();
        desiredDirection.Normalize();
        if (desiredDirection.sqrMagnitude < 0.01f)
        {
            desiredDirection = driveDirection;
        }

        Quaternion desiredRotation = Quaternion.LookRotation(desiredDirection, Vector3.up);
        rb.MoveRotation(Quaternion.RotateTowards(rb.rotation, desiredRotation, turnSpeed * Time.fixedDeltaTime));

        Vector3 targetVelocity = transform.forward * speed;
        Vector3 velocityChange = targetVelocity - rb.linearVelocity;
        velocityChange.y = 0f;
        rb.AddForce(velocityChange * GetVelocityGrip(), ForceMode.Acceleration);

        if (!EndlessFlatGround.IsWorldPositionOnRoad(position, roadWidth + 5f, chunkSize))
        {
            rb.AddForce(toCenter.normalized * GetOffRoadRecoveryForce(), ForceMode.Acceleration);
        }
    }

    private void ApplyPersonality()
    {
        switch (personality)
        {
            case TrafficPersonality.Grandma:
                speed *= 0.58f;
                turnSpeed *= 0.7f;
                break;

            case TrafficPersonality.Drunk:
                speed *= 0.88f;
                turnSpeed *= 1.25f;
                break;
        }
    }

    private float GetCenteringStrength()
    {
        return personality == TrafficPersonality.Drunk ? 0.032f : 0.052f;
    }

    private float GetVelocityGrip()
    {
        return personality == TrafficPersonality.Grandma ? 1.9f : 2.4f;
    }

    private float GetOffRoadRecoveryForce()
    {
        return personality == TrafficPersonality.Drunk ? 18f : 14f;
    }

    private float GetLaneWobble()
    {
        if (personality == TrafficPersonality.Grandma)
        {
            return Mathf.Sin(Time.time * 0.9f + wobbleSeed) * 0.035f;
        }

        if (personality != TrafficPersonality.Drunk)
        {
            return Mathf.Sin(Time.time * 1.4f + wobbleSeed) * 0.02f;
        }

        float slowWave = Mathf.Sin(Time.time * 1.8f + wobbleSeed) * 0.18f;
        float twitch = (Mathf.PerlinNoise(Time.time * 2.8f, wobbleSeed) - 0.5f) * 0.28f;
        return slowWave + twitch;
    }

    private Vector3 GetPlayerSwerveDirection()
    {
        if (personality != TrafficPersonality.Drunk || player == null)
        {
            return Vector3.zero;
        }

        swerveCooldown -= Time.fixedDeltaTime;
        if (swerveCooldown <= 0f)
        {
            swerveTimer = Random.Range(0.35f, 0.9f);
            swerveCooldown = Random.Range(2.2f, 6f);
        }

        if (swerveTimer <= 0f)
        {
            return Vector3.zero;
        }

        swerveTimer -= Time.fixedDeltaTime;
        Vector3 toPlayer = player.position - transform.position;
        toPlayer.y = 0f;
        float distance = toPlayer.magnitude;
        if (distance > 22f || distance < 2f)
        {
            return Vector3.zero;
        }

        return toPlayer.normalized * Mathf.Lerp(0.55f, 0.12f, distance / 22f);
    }

    private Vector3 GetCurrentRoadCenter(Vector3 position)
    {
        Vector3 local = EndlessFlatGround.GetRoadLocalOffset(position, chunkSize);
        bool horizontalRoad = Mathf.Abs(local.z) <= Mathf.Abs(local.x);
        if (Mathf.Abs(local.x) <= roadWidth * 0.65f && Mathf.Abs(local.z) > roadWidth * 0.65f)
        {
            horizontalRoad = false;
        }
        else if (Mathf.Abs(local.z) <= roadWidth * 0.65f && Mathf.Abs(local.x) > roadWidth * 0.65f)
        {
            horizontalRoad = true;
        }

        if (horizontalRoad)
        {
            position.z -= local.z;
        }
        else
        {
            position.x -= local.x;
        }

        return position;
    }
}
