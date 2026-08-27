using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class MinimapUI : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private float worldRadius = 95f;
    [SerializeField] private float mapSize = 190f;

    private RectTransform blipRoot;
    private RectTransform playerArrow;
    private RectTransform frameRoot;
    private readonly List<Image> policeBlips = new List<Image>();
    private Sprite circleSprite;
    private Sprite triangleSprite;

    public static MinimapUI EnsureExists(Transform target)
    {
        MinimapUI minimap = FindFirstObjectByType<MinimapUI>();
        if (minimap == null)
        {
            GameObject minimapObject = new GameObject("Minimap");
            minimap = minimapObject.AddComponent<MinimapUI>();
        }

        minimap.SetTarget(target);
        return minimap;
    }

    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
    }

    private void Awake()
    {
        circleSprite = CreateCircleSprite(96);
        triangleSprite = CreateTriangleSprite(64);
        BuildUI();
    }

    private void LateUpdate()
    {
        if (target == null || playerArrow == null)
        {
            return;
        }

        playerArrow.localRotation = Quaternion.Euler(0f, 0f, -target.eulerAngles.y);
        UpdatePoliceBlips();
    }

    private void BuildUI()
    {
        if (playerArrow != null)
        {
            return;
        }

        ClearOldMinimapContent();

        Canvas canvas = gameObject.GetComponent<Canvas>();
        if (canvas == null)
        {
            canvas = gameObject.AddComponent<Canvas>();
        }

        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 90;

        CanvasScaler scaler = gameObject.GetComponent<CanvasScaler>();
        if (scaler == null)
        {
            scaler = gameObject.AddComponent<CanvasScaler>();
        }

        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920f, 1080f);
        scaler.matchWidthOrHeight = 0.5f;

        if (gameObject.GetComponent<GraphicRaycaster>() == null)
        {
            gameObject.AddComponent<GraphicRaycaster>();
        }

        GameObject frame = new GameObject("Minimap Frame");
        frame.transform.SetParent(transform, false);
        frameRoot = frame.AddComponent<RectTransform>();
        frameRoot.anchorMin = new Vector2(1f, 1f);
        frameRoot.anchorMax = new Vector2(1f, 1f);
        frameRoot.pivot = new Vector2(1f, 1f);
        frameRoot.anchoredPosition = new Vector2(-28f, -28f);
        frameRoot.sizeDelta = new Vector2(mapSize, mapSize);

        Image background = frame.AddComponent<Image>();
        background.sprite = circleSprite;
        background.color = new Color(0.02f, 0.035f, 0.045f, 0.78f);

        Mask mask = frame.AddComponent<Mask>();
        mask.showMaskGraphic = true;

        GameObject grid = new GameObject("Minimap Grid");
        grid.transform.SetParent(frameRoot, false);
        RectTransform gridRect = grid.AddComponent<RectTransform>();
        gridRect.anchorMin = Vector2.zero;
        gridRect.anchorMax = Vector2.one;
        gridRect.offsetMin = Vector2.zero;
        gridRect.offsetMax = Vector2.zero;

        AddLine(grid.transform, new Vector2(0f, 0.5f), new Vector2(1f, 0.5f), new Color(1f, 1f, 1f, 0.12f));
        AddLine(grid.transform, new Vector2(0.5f, 0f), new Vector2(0.5f, 1f), new Color(1f, 1f, 1f, 0.12f));

        GameObject blips = new GameObject("Blips");
        blips.transform.SetParent(frameRoot, false);
        blipRoot = blips.AddComponent<RectTransform>();
        blipRoot.anchorMin = Vector2.zero;
        blipRoot.anchorMax = Vector2.one;
        blipRoot.offsetMin = Vector2.zero;
        blipRoot.offsetMax = Vector2.zero;

        playerArrow = CreateIcon("Player Arrow", blipRoot, triangleSprite, new Color(0.15f, 0.8f, 1f, 1f), new Vector2(24f, 24f));
        playerArrow.anchoredPosition = Vector2.zero;

        GameObject borderObject = new GameObject("Minimap Border");
        borderObject.transform.SetParent(frameRoot, false);
        RectTransform borderRect = borderObject.AddComponent<RectTransform>();
        borderRect.anchorMin = Vector2.zero;
        borderRect.anchorMax = Vector2.one;
        borderRect.offsetMin = new Vector2(-3f, -3f);
        borderRect.offsetMax = new Vector2(3f, 3f);

        Image border = borderObject.AddComponent<Image>();
        border.sprite = circleSprite;
        border.color = new Color(1f, 1f, 1f, 0.24f);
        border.raycastTarget = false;
    }

    private void ClearOldMinimapContent()
    {
        Image oldImage = gameObject.GetComponent<Image>();
        if (oldImage != null)
        {
            Destroy(oldImage);
        }

        Mask oldMask = gameObject.GetComponent<Mask>();
        if (oldMask != null)
        {
            Destroy(oldMask);
        }

        Transform[] children = new Transform[transform.childCount];
        for (int i = 0; i < transform.childCount; i++)
        {
            children[i] = transform.GetChild(i);
        }

        foreach (Transform child in children)
        {
            if (child != null)
            {
                Destroy(child.gameObject);
            }
        }

        policeBlips.Clear();
    }

    private void UpdatePoliceBlips()
    {
        PoliceCarAI[] policeCars = FindObjectsByType<PoliceCarAI>(FindObjectsSortMode.None);
        EnsurePoliceBlipCount(policeCars.Length);

        for (int i = 0; i < policeBlips.Count; i++)
        {
            bool active = i < policeCars.Length && policeCars[i] != null;
            policeBlips[i].gameObject.SetActive(active);
            if (!active)
            {
                continue;
            }

            Vector3 offset = policeCars[i].transform.position - target.position;
            Vector2 mapOffset = new Vector2(offset.x, offset.z) / worldRadius;
            mapOffset = Vector2.ClampMagnitude(mapOffset, 1f);
            policeBlips[i].rectTransform.anchoredPosition = mapOffset * (mapSize * 0.43f);
        }
    }

    private void EnsurePoliceBlipCount(int count)
    {
        while (policeBlips.Count < count)
        {
            RectTransform blip = CreateIcon("Police Blip", blipRoot, circleSprite, new Color(1f, 0.08f, 0.04f, 1f), new Vector2(13f, 13f));
            policeBlips.Add(blip.GetComponent<Image>());
        }
    }

    private RectTransform CreateIcon(string iconName, Transform parent, Sprite sprite, Color color, Vector2 size)
    {
        GameObject icon = new GameObject(iconName);
        icon.transform.SetParent(parent, false);

        RectTransform rect = icon.AddComponent<RectTransform>();
        rect.sizeDelta = size;
        rect.anchorMin = new Vector2(0.5f, 0.5f);
        rect.anchorMax = new Vector2(0.5f, 0.5f);
        rect.pivot = new Vector2(0.5f, 0.5f);

        Image image = icon.AddComponent<Image>();
        image.sprite = sprite;
        image.color = color;
        image.raycastTarget = false;

        return rect;
    }

    private void AddLine(Transform parent, Vector2 anchorMin, Vector2 anchorMax, Color color)
    {
        GameObject lineObject = new GameObject("Line");
        lineObject.transform.SetParent(parent, false);

        RectTransform rect = lineObject.AddComponent<RectTransform>();
        rect.anchorMin = anchorMin;
        rect.anchorMax = anchorMax;
        rect.sizeDelta = new Vector2(anchorMin.x == anchorMax.x ? 2f : 0f, anchorMin.y == anchorMax.y ? 2f : 0f);
        rect.anchoredPosition = Vector2.zero;

        Image image = lineObject.AddComponent<Image>();
        image.color = color;
        image.raycastTarget = false;
    }

    private static Sprite CreateCircleSprite(int size)
    {
        Texture2D texture = new Texture2D(size, size, TextureFormat.RGBA32, false);
        Color32 clear = new Color32(0, 0, 0, 0);
        Color32 white = new Color32(255, 255, 255, 255);
        Vector2 center = new Vector2((size - 1) * 0.5f, (size - 1) * 0.5f);
        float radius = size * 0.48f;

        for (int y = 0; y < size; y++)
        {
            for (int x = 0; x < size; x++)
            {
                float distance = Vector2.Distance(new Vector2(x, y), center);
                texture.SetPixel(x, y, distance <= radius ? white : clear);
            }
        }

        texture.Apply();
        return Sprite.Create(texture, new Rect(0f, 0f, size, size), new Vector2(0.5f, 0.5f), size);
    }

    private static Sprite CreateTriangleSprite(int size)
    {
        Texture2D texture = new Texture2D(size, size, TextureFormat.RGBA32, false);
        Color32 clear = new Color32(0, 0, 0, 0);
        Color32 white = new Color32(255, 255, 255, 255);

        for (int y = 0; y < size; y++)
        {
            for (int x = 0; x < size; x++)
            {
                float normalizedY = y / (float)(size - 1);
                float centerX = (size - 1) * 0.5f;
                float halfWidth = Mathf.Lerp(size * 0.34f, 1f, normalizedY);
                bool inside = Mathf.Abs(x - centerX) <= halfWidth && normalizedY > 0.12f;
                texture.SetPixel(x, y, inside ? white : clear);
            }
        }

        texture.Apply();
        return Sprite.Create(texture, new Rect(0f, 0f, size, size), new Vector2(0.5f, 0.5f), size);
    }
}
