using UnityEngine;

#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

[RequireComponent(typeof(Rigidbody))]
public class ArcadeCarController : MonoBehaviour
{
    [Header("Driving")]
    [SerializeField] private float acceleration = 28f;
    [SerializeField] private float reverseAcceleration = 16f;
    [SerializeField] private float maxSpeed = 18f;
    [SerializeField] private float turnSpeed = 115f;
    [SerializeField] private float steeringBuildUp = 3.5f;
    [SerializeField] private float steeringReturn = 5f;
    [SerializeField] private float brakingDrag = 3f;
    [SerializeField] private float rollingDrag = 0.7f;

    private Rigidbody rb;
    private float throttleInput;
    private float steerInput;
    private float currentSteer;
    private bool brakeInput;

    public float CurrentSteer => currentSteer;
    public float SpeedPercent => Mathf.Clamp01(rb.linearVelocity.magnitude / maxSpeed);
    public float SignedForwardSpeed => Vector3.Dot(rb.linearVelocity, transform.forward);
    public bool IsBraking => brakeInput;
    public bool IsAccelerating => throttleInput > 0.01f;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
        rb.centerOfMass = new Vector3(0f, -0.35f, 0f);
        rb.linearDamping = rollingDrag;
        rb.angularDamping = 4f;
        rb.interpolation = RigidbodyInterpolation.Interpolate;
        rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;
    }

    private void Update()
    {
        ReadInput();
    }

    private void FixedUpdate()
    {
        rb.linearDamping = brakeInput ? brakingDrag : rollingDrag;

        float speedForward = Vector3.Dot(rb.linearVelocity, transform.forward);
        float motorPower = throttleInput >= 0f ? acceleration : reverseAcceleration;

        if (Mathf.Abs(speedForward) < maxSpeed || Mathf.Sign(throttleInput) != Mathf.Sign(speedForward))
        {
            rb.AddForce(transform.forward * throttleInput * motorPower, ForceMode.Acceleration);
        }

        float steeringSharpness = Mathf.Abs(steerInput) > 0.01f ? steeringBuildUp : steeringReturn;
        currentSteer = Mathf.Lerp(currentSteer, steerInput, 1f - Mathf.Exp(-steeringSharpness * Time.fixedDeltaTime));

        float speedFactor = Mathf.Clamp01(rb.linearVelocity.magnitude / 2f);
        float turnDirection = speedForward >= 0f ? 1f : -1f;
        float turnAmount = currentSteer * turnSpeed * speedFactor * turnDirection * Time.fixedDeltaTime;
        rb.MoveRotation(rb.rotation * Quaternion.Euler(0f, turnAmount, 0f));
    }

    private void ReadInput()
    {
#if ENABLE_INPUT_SYSTEM
        Keyboard keyboard = Keyboard.current;
        if (keyboard == null)
        {
            throttleInput = 0f;
            steerInput = 0f;
            brakeInput = false;
            return;
        }

        float forward = keyboard.wKey.isPressed || keyboard.upArrowKey.isPressed ? 1f : 0f;
        float reverse = keyboard.sKey.isPressed || keyboard.downArrowKey.isPressed ? 1f : 0f;
        float right = keyboard.dKey.isPressed || keyboard.rightArrowKey.isPressed ? 1f : 0f;
        float left = keyboard.aKey.isPressed || keyboard.leftArrowKey.isPressed ? 1f : 0f;

        throttleInput = forward - reverse;
        steerInput = right - left;
        brakeInput = keyboard.spaceKey.isPressed;
#else
        throttleInput = Input.GetAxisRaw("Vertical");
        steerInput = Input.GetAxisRaw("Horizontal");
        brakeInput = Input.GetKey(KeyCode.Space);
#endif
    }
}
