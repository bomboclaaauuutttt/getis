using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class PoliceCarAI : MonoBehaviour
{
    public enum DrivingPersonality
    {
        Calm,
        Balanced,
        Aggressive
    }

    [SerializeField] private Transform target;
    [SerializeField] private float acceleration = 24f;
    [SerializeField] private float maxSpeed = 20f;
    [SerializeField] private float turnSpeed = 140f;
    [SerializeField] private float stoppingDistance = 3.2f;
    [SerializeField] private float repathDistance = 1.5f;
    [SerializeField] private float directChaseDistance = 22f;
    [SerializeField] private float contactDistance = 1.25f;
    [SerializeField] private float targetLeadTime = 0.35f;
    [SerializeField] private float sideGrip = 7f;
    [SerializeField] private float closePushAcceleration = 9f;
    [SerializeField] private float stuckSpeedThreshold = 1.1f;
    [SerializeField] private float stuckCheckDelay = 1.15f;
    [SerializeField] private DrivingPersonality personality = DrivingPersonality.Balanced;

    private Rigidbody rb;
    private Rigidbody targetRb;
    private Vector3 chaseOffset;
    private float stuckTimer;
    private float reverseTimer;
    private float accelerationMultiplier = 1f;
    private float speedMultiplier = 1f;
    private float turnMultiplier = 1f;
    private float distanceMultiplier = 1f;
    private float brakingMultiplier = 1f;

    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
        targetRb = target != null ? target.GetComponent<Rigidbody>() : null;
    }

    public void SetChaseOffset(Vector3 offset)
    {
        chaseOffset = offset;
    }

    public void SetPersonality(DrivingPersonality newPersonality)
    {
        personality = newPersonality;
        ApplyPersonality();
    }

    public float DistanceToTarget
    {
        get
        {
            if (target == null)
            {
                return float.MaxValue;
            }

            return Vector3.Distance(transform.position, target.position);
        }
    }

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
        rb.centerOfMass = new Vector3(0f, -0.35f, 0f);
        rb.linearDamping = 0.55f;
        rb.angularDamping = 4f;
        rb.interpolation = RigidbodyInterpolation.Interpolate;
        rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;
        ApplyPersonality();
    }

    private void FixedUpdate()
    {
        if (target == null)
        {
            return;
        }

        Vector3 targetVelocity = targetRb != null ? targetRb.linearVelocity : Vector3.zero;
        targetVelocity.y = 0f;

        Vector3 flatTargetPosition = target.position;
        flatTargetPosition.y = transform.position.y;
        float realDistance = Vector3.Distance(transform.position, flatTargetPosition);
        float offsetBlend = Mathf.InverseLerp(7f, directChaseDistance, realDistance);
        Vector3 targetPosition = target.position + targetVelocity * targetLeadTime + target.TransformDirection(chaseOffset) * offsetBlend;
        Vector3 toTarget = targetPosition - transform.position;
        toTarget.y = 0f;

        if (toTarget.sqrMagnitude < 0.01f)
        {
            return;
        }

        ApplyLateralGrip();

        Vector3 desiredDirection = toTarget.normalized;
        float angle = Vector3.SignedAngle(transform.forward, desiredDirection, Vector3.up);
        float turn = Mathf.Clamp(angle / 45f, -1f, 1f);
        float speedForward = Vector3.Dot(rb.linearVelocity, transform.forward);
        float distance = toTarget.magnitude;
        bool closeToPlayer = realDistance <= directChaseDistance;
        bool facingAway = Mathf.Abs(angle) > 105f;

        UpdateStuckRecovery(realDistance, speedForward, facingAway);

        float closeTurnBoost = closeToPlayer ? 1.28f : 1f;
        float turnAmount = turn * turnSpeed * turnMultiplier * closeTurnBoost * Time.fixedDeltaTime;
        rb.MoveRotation(rb.rotation * Quaternion.Euler(0f, turnAmount, 0f));

        float desiredStoppingDistance = Mathf.Min(stoppingDistance * distanceMultiplier, contactDistance);
        float desiredMaxSpeed = maxSpeed * speedMultiplier;

        if (reverseTimer > 0f)
        {
            reverseTimer -= Time.fixedDeltaTime;
            rb.AddForce(-transform.forward * acceleration * accelerationMultiplier * 0.85f, ForceMode.Acceleration);
            return;
        }

        if (facingAway && speedForward > 4f)
        {
            rb.AddForce(-transform.forward * acceleration * brakingMultiplier, ForceMode.Acceleration);
        }
        else if ((distance > desiredStoppingDistance || closeToPlayer) && rb.linearVelocity.magnitude < desiredMaxSpeed)
        {
            float alignment = closeToPlayer ? 1f : Mathf.Clamp01(Vector3.Dot(transform.forward, desiredDirection) + 0.25f);
            rb.AddForce(transform.forward * acceleration * accelerationMultiplier * alignment, ForceMode.Acceleration);
        }
        else if (speedForward > 0f)
        {
            rb.AddForce(-transform.forward * acceleration * brakingMultiplier * 0.35f, ForceMode.Acceleration);
        }

        if (closeToPlayer)
        {
            Vector3 directDirection = flatTargetPosition - transform.position;
            directDirection.y = 0f;
            if (directDirection.sqrMagnitude > 0.01f)
            {
                rb.AddForce(directDirection.normalized * closePushAcceleration * accelerationMultiplier, ForceMode.Acceleration);
            }
        }

        if (distance > repathDistance && Vector3.Dot(rb.linearVelocity, transform.forward) < -2f)
        {
            rb.AddForce(transform.forward * acceleration * accelerationMultiplier, ForceMode.Acceleration);
        }
    }

    private void ApplyLateralGrip()
    {
        Vector3 lateralVelocity = Vector3.Dot(rb.linearVelocity, transform.right) * transform.right;
        rb.AddForce(-lateralVelocity * sideGrip, ForceMode.Acceleration);
    }

    private void UpdateStuckRecovery(float realDistance, float speedForward, bool facingAway)
    {
        bool needsRecovery = realDistance > 4f && rb.linearVelocity.magnitude < stuckSpeedThreshold;
        if (!needsRecovery)
        {
            stuckTimer = 0f;
            return;
        }

        stuckTimer += Time.fixedDeltaTime;
        if (stuckTimer < stuckCheckDelay)
        {
            return;
        }

        stuckTimer = 0f;
        if (facingAway || speedForward > -0.5f)
        {
            reverseTimer = 0.38f;
        }
        else
        {
            rb.AddForce(transform.forward * acceleration * accelerationMultiplier * 1.35f, ForceMode.Acceleration);
        }
    }

    private void ApplyPersonality()
    {
        switch (personality)
        {
            case DrivingPersonality.Calm:
                accelerationMultiplier = 0.78f;
                speedMultiplier = 0.86f;
                turnMultiplier = 0.78f;
                distanceMultiplier = 1.15f;
                brakingMultiplier = 1.2f;
                break;

            case DrivingPersonality.Aggressive:
                accelerationMultiplier = 1.28f;
                speedMultiplier = 1.18f;
                turnMultiplier = 1.18f;
                distanceMultiplier = 0.62f;
                brakingMultiplier = 0.72f;
                break;

            default:
                accelerationMultiplier = 1f;
                speedMultiplier = 1f;
                turnMultiplier = 1f;
                distanceMultiplier = 1f;
                brakingMultiplier = 1f;
                break;
        }
    }
}
