using UnityEngine;

[RequireComponent(typeof(Collider))]
public class PoliceContactSensor : MonoBehaviour
{
    private ArrestSystem arrestSystem;

    public void Configure(ArrestSystem system)
    {
        arrestSystem = system;
    }

    private void OnCollisionStay(Collision collision)
    {
        if (arrestSystem == null)
        {
            return;
        }

        PoliceCarAI policeCar = collision.collider.GetComponentInParent<PoliceCarAI>();
        if (policeCar != null)
        {
            arrestSystem.ReportPoliceContact();
        }
    }
}
