using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class VehicleCollisionPushback : MonoBehaviour
{
    [SerializeField] private float minimumPushSpeed = 1.2f;
    [SerializeField] private float velocityDamping = 0.62f;
    [SerializeField] private float counterForce = 20f;
    [SerializeField] private float maxSpeedWhilePushing = 3.8f;

    private Rigidbody rb;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
    }

    private void OnCollisionStay(Collision collision)
    {
        Rigidbody otherRb = collision.rigidbody;
        if (otherRb == null || !IsVehicle(collision.transform))
        {
            return;
        }

        Vector3 toOther = otherRb.worldCenterOfMass - rb.worldCenterOfMass;
        toOther.y = 0f;
        if (toOther.sqrMagnitude < 0.01f)
        {
            return;
        }

        Vector3 pushDirection = toOther.normalized;
        float ownPushSpeed = Vector3.Dot(rb.linearVelocity, pushDirection);
        float otherPushSpeed = Vector3.Dot(otherRb.linearVelocity, -pushDirection);
        if (ownPushSpeed < minimumPushSpeed || ownPushSpeed <= otherPushSpeed + 0.25f)
        {
            return;
        }

        float pushStrength = Mathf.InverseLerp(minimumPushSpeed, 9f, ownPushSpeed);
        Vector3 pushVelocity = pushDirection * ownPushSpeed;
        rb.linearVelocity -= pushVelocity * velocityDamping * pushStrength * Time.fixedDeltaTime * 8f;
        rb.AddForce(-pushDirection * counterForce * pushStrength, ForceMode.Acceleration);

        float forwardSpeed = Vector3.Dot(rb.linearVelocity, transform.forward);
        if (forwardSpeed > maxSpeedWhilePushing)
        {
            rb.linearVelocity -= transform.forward * (forwardSpeed - maxSpeedWhilePushing) * 0.45f;
        }
    }

    private static bool IsVehicle(Transform hitTransform)
    {
        return hitTransform.GetComponentInParent<ArcadeCarController>() != null
            || hitTransform.GetComponentInParent<PoliceCarAI>() != null
            || hitTransform.GetComponentInParent<TrafficCarAI>() != null;
    }
}
