using UnityEngine;

public class LakeHazard : MonoBehaviour
{
    private void OnTriggerEnter(Collider other)
    {
        ArcadeCarController playerCar = other.GetComponentInParent<ArcadeCarController>();
        if (playerCar != null)
        {
            LakeFallSystem.EnsureExists().DropPlayer(playerCar.gameObject);
        }
    }
}
