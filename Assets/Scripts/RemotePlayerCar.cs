using UnityEngine;

public class RemotePlayerCar : MonoBehaviour
{
    [SerializeField] private float positionSharpness = 12f;
    [SerializeField] private float rotationSharpness = 14f;

    private Vector3 targetPosition;
    private Quaternion targetRotation = Quaternion.identity;
    private bool hasState;

    public void SetState(Vector3 position, Quaternion rotation)
    {
        targetPosition = position;
        targetRotation = rotation;

        if (hasState)
        {
            return;
        }

        hasState = true;
        transform.SetPositionAndRotation(position, rotation);
    }

    private void Update()
    {
        if (!hasState)
        {
            return;
        }

        transform.position = Vector3.Lerp(transform.position, targetPosition, 1f - Mathf.Exp(-positionSharpness * Time.deltaTime));
        transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, 1f - Mathf.Exp(-rotationSharpness * Time.deltaTime));
    }
}
