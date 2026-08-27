using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

public class CameraOcclusionFader : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private float targetHeight = 0.85f;
    [SerializeField] private float checkRadius = 0.8f;
    [SerializeField] private float fadedAlpha = 0.12f;
    [SerializeField] private float fadeSpeed = 14f;

    private readonly Dictionary<Renderer, FadedRenderer> fadedRenderers = new Dictionary<Renderer, FadedRenderer>();
    private readonly HashSet<Renderer> visibleThisFrame = new HashSet<Renderer>();
    private readonly RaycastHit[] hits = new RaycastHit[32];

    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
    }

    private void LateUpdate()
    {
        visibleThisFrame.Clear();

        if (target != null)
        {
            FindBlockingRenderers();
        }

        UpdateFades();
    }

    private void FindBlockingRenderers()
    {
        Vector3 start = transform.position;
        Vector3 end = target.position + Vector3.up * targetHeight;
        Vector3 direction = end - start;
        float distance = direction.magnitude;

        if (distance <= 0.1f)
        {
            return;
        }

        int hitCount = Physics.SphereCastNonAlloc(start, checkRadius, direction / distance, hits, distance, ~0, QueryTriggerInteraction.Ignore);
        for (int i = 0; i < hitCount; i++)
        {
            Collider hitCollider = hits[i].collider;
            if (hitCollider == null || ShouldIgnore(hitCollider.transform))
            {
                continue;
            }

            AddRenderersFrom(hitCollider.transform);
        }
    }

    private bool ShouldIgnore(Transform hitTransform)
    {
        if (target != null && hitTransform.IsChildOf(target))
        {
            return true;
        }

        if (hitTransform.GetComponentInParent<ArcadeCarController>() != null
            || hitTransform.GetComponentInParent<PoliceCarAI>() != null
            || hitTransform.GetComponentInParent<TrafficCarAI>() != null
            || hitTransform.GetComponentInParent<LakeHazard>() != null)
        {
            return true;
        }

        string objectName = hitTransform.name;
        return objectName == "Ground"
            || objectName == "Road"
            || objectName == "Road Line"
            || objectName == "Starting Parking Lot"
            || objectName == "Parking Line"
            || objectName == "Smooth Physics Ground";
    }

    private void AddRenderersFrom(Transform hitTransform)
    {
        Transform fadeRoot = GetFadeRoot(hitTransform);
        Renderer[] renderers = fadeRoot.GetComponentsInChildren<Renderer>();
        foreach (Renderer renderer in renderers)
        {
            if (renderer == null || renderer is ParticleSystemRenderer)
            {
                continue;
            }

            visibleThisFrame.Add(renderer);
            if (!fadedRenderers.ContainsKey(renderer))
            {
                fadedRenderers.Add(renderer, new FadedRenderer(renderer));
            }
        }
    }

    private Transform GetFadeRoot(Transform hitTransform)
    {
        Transform current = hitTransform;
        while (current != null)
        {
            if (IsFadeGroupRoot(current))
            {
                return current;
            }

            if (current.parent == null || current.parent.name.StartsWith("Ground Chunk"))
            {
                break;
            }

            current = current.parent;
        }

        return hitTransform;
    }

    private static bool IsFadeGroupRoot(Transform candidate)
    {
        string objectName = candidate.name;
        return objectName == "House"
            || objectName == "Tree"
            || objectName == "Street Light"
            || objectName == "Rare Shop"
            || objectName == "Gas Stop"
            || objectName == "Special Warehouse"
            || objectName == "Special Radio Tower"
            || objectName == "Special Water Tower";
    }

    private void UpdateFades()
    {
        List<Renderer> restoredRenderers = null;
        foreach (KeyValuePair<Renderer, FadedRenderer> item in fadedRenderers)
        {
            Renderer renderer = item.Key;
            if (renderer == null)
            {
                restoredRenderers ??= new List<Renderer>();
                restoredRenderers.Add(renderer);
                continue;
            }

            bool shouldFade = visibleThisFrame.Contains(renderer);
            bool finished = item.Value.Update(shouldFade ? fadedAlpha : 1f, fadeSpeed);
            if (!shouldFade && finished)
            {
                item.Value.Restore();
                restoredRenderers ??= new List<Renderer>();
                restoredRenderers.Add(renderer);
            }
        }

        if (restoredRenderers == null)
        {
            return;
        }

        foreach (Renderer renderer in restoredRenderers)
        {
            fadedRenderers.Remove(renderer);
        }
    }

    private sealed class FadedRenderer
    {
        private readonly Renderer renderer;
        private readonly Material[] materials;
        private readonly Color[] originalColors;
        private readonly Color[] originalBaseColors;
        private readonly int[] originalRenderQueues;
        private readonly bool[] hadModeProperty;
        private readonly bool[] hadBaseColorProperty;
        private readonly float[] originalModes;
        private readonly ShadowCastingMode originalShadowCastingMode;
        private float currentAlpha = 1f;

        public FadedRenderer(Renderer renderer)
        {
            this.renderer = renderer;
            materials = renderer.materials;
            originalColors = new Color[materials.Length];
            originalBaseColors = new Color[materials.Length];
            originalRenderQueues = new int[materials.Length];
            hadModeProperty = new bool[materials.Length];
            hadBaseColorProperty = new bool[materials.Length];
            originalModes = new float[materials.Length];
            originalShadowCastingMode = renderer.shadowCastingMode;

            for (int i = 0; i < materials.Length; i++)
            {
                Material material = materials[i];
                originalColors[i] = material.color;
                originalRenderQueues[i] = material.renderQueue;
                hadModeProperty[i] = material.HasProperty("_Mode");
                hadBaseColorProperty[i] = material.HasProperty("_BaseColor");
                if (hadBaseColorProperty[i])
                {
                    originalBaseColors[i] = material.GetColor("_BaseColor");
                }

                if (hadModeProperty[i])
                {
                    originalModes[i] = material.GetFloat("_Mode");
                }

                MakeTransparent(material);
            }

            renderer.shadowCastingMode = ShadowCastingMode.Off;
        }

        public bool Update(float targetAlpha, float fadeSpeed)
        {
            currentAlpha = Mathf.Lerp(currentAlpha, targetAlpha, 1f - Mathf.Exp(-fadeSpeed * Time.deltaTime));
            for (int i = 0; i < materials.Length; i++)
            {
                Color color = originalColors[i];
                color.a = originalColors[i].a * currentAlpha;
                materials[i].color = color;

                if (hadBaseColorProperty[i])
                {
                    Color baseColor = originalBaseColors[i];
                    baseColor.a = originalBaseColors[i].a * currentAlpha;
                    materials[i].SetColor("_BaseColor", baseColor);
                }
            }

            return Mathf.Abs(currentAlpha - targetAlpha) < 0.015f;
        }

        public void Restore()
        {
            for (int i = 0; i < materials.Length; i++)
            {
                Material material = materials[i];
                material.color = originalColors[i];
                material.renderQueue = originalRenderQueues[i];

                if (hadBaseColorProperty[i])
                {
                    material.SetColor("_BaseColor", originalBaseColors[i]);
                }

                if (hadModeProperty[i])
                {
                    material.SetFloat("_Mode", originalModes[i]);
                }
            }

            renderer.shadowCastingMode = originalShadowCastingMode;
        }

        private static void MakeTransparent(Material material)
        {
            if (material.HasProperty("_Mode"))
            {
                material.SetFloat("_Mode", 3f);
            }

            if (material.HasProperty("_Surface"))
            {
                material.SetFloat("_Surface", 1f);
            }

            material.SetOverrideTag("RenderType", "Transparent");
            material.SetInt("_SrcBlend", (int)BlendMode.SrcAlpha);
            material.SetInt("_DstBlend", (int)BlendMode.OneMinusSrcAlpha);
            material.SetInt("_ZWrite", 0);
            material.EnableKeyword("_ALPHABLEND_ON");
            material.DisableKeyword("_ALPHATEST_ON");
            material.renderQueue = 3000;
        }
    }
}
