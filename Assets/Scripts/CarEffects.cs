using UnityEngine;

[RequireComponent(typeof(ArcadeCarController))]
public class CarEffects : MonoBehaviour
{
    [SerializeField] private Transform visualRoot;
    [SerializeField] private ParticleSystem exhaustSmoke;
    [SerializeField] private ParticleSystem leftTireDust;
    [SerializeField] private ParticleSystem rightTireDust;
    [SerializeField] private float maxBodyRoll = 8f;
    [SerializeField] private float maxBodyPitch = 4f;
    [SerializeField] private float visualSmoothing = 9f;

    private ArcadeCarController car;
    private Quaternion visualStartRotation;

    public void Configure(Transform newVisualRoot, ParticleSystem newExhaustSmoke, ParticleSystem newLeftTireDust, ParticleSystem newRightTireDust)
    {
        visualRoot = newVisualRoot;
        exhaustSmoke = newExhaustSmoke;
        leftTireDust = newLeftTireDust;
        rightTireDust = newRightTireDust;

        if (visualRoot != null && visualRoot != transform)
        {
            visualStartRotation = visualRoot.localRotation;
        }
    }

    private void Awake()
    {
        car = GetComponent<ArcadeCarController>();

        if (visualRoot == null && transform.childCount > 0)
        {
            visualRoot = transform.GetChild(0);
        }

        if (visualRoot != null)
        {
            visualStartRotation = visualRoot.localRotation;
        }
    }

    private void Update()
    {
        UpdateBodyMotion();
        UpdateParticles();
    }

    private void UpdateBodyMotion()
    {
        if (visualRoot == null || visualRoot == transform)
        {
            return;
        }

        float speed = car.SpeedPercent;
        float roll = -car.CurrentSteer * maxBodyRoll * speed;
        float pitch = car.IsAccelerating ? -maxBodyPitch * speed : 0f;

        if (car.IsBraking)
        {
            pitch = maxBodyPitch * Mathf.Max(0.35f, speed);
        }

        Quaternion targetRotation = visualStartRotation * Quaternion.Euler(pitch, 0f, roll);
        visualRoot.localRotation = Quaternion.Slerp(
            visualRoot.localRotation,
            targetRotation,
            1f - Mathf.Exp(-visualSmoothing * Time.deltaTime));
    }

    private void UpdateParticles()
    {
        float speed = car.SpeedPercent;
        float slideAmount = Mathf.Abs(car.CurrentSteer) * speed;
        bool makingTireDust = speed > 0.15f && (car.IsBraking || slideAmount > 0.28f);

        SetEmission(exhaustSmoke, car.IsAccelerating ? Mathf.Lerp(8f, 26f, speed) : 4f);
        SetEmission(leftTireDust, makingTireDust ? Mathf.Lerp(10f, 45f, slideAmount) : 0f);
        SetEmission(rightTireDust, makingTireDust ? Mathf.Lerp(10f, 45f, slideAmount) : 0f);
    }

    private static void SetEmission(ParticleSystem particles, float rate)
    {
        if (particles == null)
        {
            return;
        }

        ParticleSystem.EmissionModule emission = particles.emission;
        emission.rateOverTime = rate;
    }
}
