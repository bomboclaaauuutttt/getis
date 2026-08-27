using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private Vector3 offset = new Vector3(0f, 16f, -13f);
    [SerializeField] private float followSharpness = 8f;
    [SerializeField] private float speedZoomOut = 4f;
    [SerializeField] private float cameraRoll = 4f;
    [SerializeField] private float shakeAmount = 0.18f;
    [SerializeField] private float shakeSpeed = 18f;

    private ArcadeCarController targetCar;
    private Camera attachedCamera;
    private float baseFieldOfView;

    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
        targetCar = target != null ? target.GetComponent<ArcadeCarController>() : null;
        SnapToTarget();
    }

    private void Awake()
    {
        attachedCamera = GetComponent<Camera>();
        if (attachedCamera != null)
        {
            baseFieldOfView = attachedCamera.fieldOfView;
        }
    }

    private void LateUpdate()
    {
        if (target == null)
        {
            return;
        }

        float speedPercent = targetCar != null ? targetCar.SpeedPercent : 0f;
        float steer = targetCar != null ? targetCar.CurrentSteer : 0f;
        Vector3 dynamicOffset = offset + new Vector3(0f, speedPercent * speedZoomOut, -speedPercent * speedZoomOut);
        Vector3 desiredPosition = target.position + dynamicOffset + GetShake(speedPercent);
        transform.position = Vector3.Lerp(transform.position, desiredPosition, 1f - Mathf.Exp(-followSharpness * Time.deltaTime));

        Quaternion lookRotation = Quaternion.LookRotation(target.position + Vector3.up * 1.2f - transform.position, Vector3.up);
        Quaternion rollRotation = Quaternion.AngleAxis(-steer * cameraRoll * speedPercent, Vector3.forward);
        transform.rotation = lookRotation * rollRotation;

        if (attachedCamera != null)
        {
            attachedCamera.fieldOfView = Mathf.Lerp(attachedCamera.fieldOfView, baseFieldOfView + speedPercent * 7f, 1f - Mathf.Exp(-5f * Time.deltaTime));
        }
    }

    private void SnapToTarget()
    {
        if (target == null)
        {
            return;
        }

        transform.position = target.position + offset;
        transform.LookAt(target.position + Vector3.up * 1.2f);
    }

    private Vector3 GetShake(float speedPercent)
    {
        float strength = Mathf.Clamp01((speedPercent - 0.55f) / 0.45f) * shakeAmount;
        if (strength <= 0f)
        {
            return Vector3.zero;
        }

        float time = Time.time * shakeSpeed;
        return new Vector3(Mathf.PerlinNoise(time, 0f) - 0.5f, Mathf.PerlinNoise(0f, time) - 0.5f, 0f) * strength;
    }
}
