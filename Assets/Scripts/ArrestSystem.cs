using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
#endif

public class ArrestSystem : MonoBehaviour
{
    [SerializeField] private float arrestTime = 4f;
    [SerializeField] private float contactGraceTime = 0.14f;
    [SerializeField] private float arrestCooldownMultiplier = 2f;

    private float contactTimer;
    private float lastContactTime = -999f;
    private bool arrested;
    private Image grayscaleOverlay;
    private Image darknessOverlay;
    private Image vignetteOverlay;
    private GameObject arrestedGroup;
    private Sprite vignetteSprite;

    public static ArrestSystem EnsureExists(GameObject player)
    {
        ArrestSystem system = FindFirstObjectByType<ArrestSystem>();
        if (system == null)
        {
            GameObject systemObject = new GameObject("Arrest System");
            system = systemObject.AddComponent<ArrestSystem>();
        }

        system.ConfigurePlayer(player);
        return system;
    }

    public void ReportPoliceContact()
    {
        if (arrested)
        {
            return;
        }

        lastContactTime = Time.time;
    }

    private void Awake()
    {
        BuildUI();
    }

    private void Update()
    {
        if (arrested)
        {
            return;
        }

        bool touchingPolice = Time.time - lastContactTime <= contactGraceTime;
        float timerDelta = touchingPolice ? Time.deltaTime : -Time.deltaTime * arrestCooldownMultiplier;
        contactTimer = Mathf.Clamp(contactTimer + timerDelta, 0f, arrestTime);
        UpdateWarning();

        if (contactTimer >= arrestTime)
        {
            ArrestPlayer();
        }
    }

    private void ConfigurePlayer(GameObject player)
    {
        if (player == null)
        {
            return;
        }

        ResetArrestState();

        PoliceContactSensor sensor = player.GetComponent<PoliceContactSensor>();
        if (sensor == null)
        {
            sensor = player.AddComponent<PoliceContactSensor>();
        }

        sensor.Configure(this);
    }

    private void ResetArrestState()
    {
        arrested = false;
        contactTimer = 0f;
        lastContactTime = -999f;
        Time.timeScale = 1f;

        if (arrestedGroup != null)
        {
            arrestedGroup.SetActive(false);
        }

        if (grayscaleOverlay != null && darknessOverlay != null && vignetteOverlay != null)
        {
            UpdateWarning();
        }
    }

    private void BuildUI()
    {
        EnsureEventSystem();
        vignetteSprite = CreateVignetteSprite(256);

        Canvas canvas = gameObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 110;

        CanvasScaler scaler = gameObject.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920f, 1080f);
        scaler.matchWidthOrHeight = 0.5f;

        gameObject.AddComponent<GraphicRaycaster>();

        grayscaleOverlay = CreateImage("Arrest Grayscale Overlay", transform, new Color(0.52f, 0.52f, 0.52f, 0f));
        grayscaleOverlay.raycastTarget = false;

        darknessOverlay = CreateImage("Arrest Darkness Overlay", transform, new Color(0f, 0f, 0f, 0f));
        darknessOverlay.raycastTarget = false;

        vignetteOverlay = CreateImage("Arrest Soft Blur Vignette", transform, new Color(0f, 0f, 0f, 0f));
        vignetteOverlay.sprite = vignetteSprite;
        vignetteOverlay.raycastTarget = false;

        arrestedGroup = CreateFullScreenGroup("Arrested Screen");
        Image arrestedBackground = CreateImage("Arrested Background", arrestedGroup.transform, new Color(0.02f, 0.01f, 0.01f, 0.92f));
        arrestedBackground.raycastTarget = true;
        CreateText(arrestedGroup.transform, "ARRESTED", 92, FontStyle.Bold, new Vector2(0f, 115f), new Vector2(900f, 130f));
        CreateText(arrestedGroup.transform, "You lost the chase", 34, FontStyle.Normal, new Vector2(0f, 20f), new Vector2(680f, 70f));
        CreateButton(arrestedGroup.transform, "RESTART", new Vector2(0f, -105f), RestartGame);

        arrestedGroup.SetActive(false);
    }

    private void UpdateWarning()
    {
        float progress = Mathf.Clamp01(contactTimer / arrestTime);
        float grayscaleAlpha = progress > 0f ? Mathf.Lerp(0.12f, 0.58f, progress) : 0f;
        float darknessAlpha = progress > 0f ? Mathf.Lerp(0.04f, 0.34f, progress) : 0f;
        float vignetteAlpha = progress > 0f ? Mathf.Lerp(0.18f, 0.72f, progress) : 0f;

        grayscaleOverlay.color = new Color(0.52f, 0.52f, 0.52f, grayscaleAlpha);
        darknessOverlay.color = new Color(0f, 0f, 0f, darknessAlpha);
        vignetteOverlay.color = new Color(0f, 0f, 0f, vignetteAlpha);
    }

    private void ArrestPlayer()
    {
        arrested = true;
        Time.timeScale = 0f;
        grayscaleOverlay.color = new Color(0.52f, 0.52f, 0.52f, 0.66f);
        darknessOverlay.color = new Color(0f, 0f, 0f, 0.55f);
        vignetteOverlay.color = new Color(0f, 0f, 0f, 0.85f);
        arrestedGroup.SetActive(true);
    }

    private void RestartGame()
    {
        Time.timeScale = 1f;
        Scene activeScene = SceneManager.GetActiveScene();
        SceneManager.LoadScene(activeScene.buildIndex);
        Destroy(gameObject);
    }

    private GameObject CreateFullScreenGroup(string groupName)
    {
        GameObject group = new GameObject(groupName);
        group.transform.SetParent(transform, false);

        RectTransform rect = group.AddComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;

        return group;
    }

    private Image CreateImage(string imageName, Transform parent, Color color)
    {
        GameObject imageObject = new GameObject(imageName);
        imageObject.transform.SetParent(parent, false);

        RectTransform rect = imageObject.AddComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;

        Image image = imageObject.AddComponent<Image>();
        image.color = color;
        return image;
    }

    private Text CreateText(Transform parent, string value, int fontSize, FontStyle style, Vector2 position, Vector2 size)
    {
        GameObject textObject = new GameObject(value);
        textObject.transform.SetParent(parent, false);

        RectTransform rect = textObject.AddComponent<RectTransform>();
        rect.sizeDelta = size;
        rect.anchoredPosition = position;

        Text text = textObject.AddComponent<Text>();
        text.text = value;
        text.alignment = TextAnchor.MiddleCenter;
        text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        text.fontSize = fontSize;
        text.fontStyle = style;
        text.color = Color.white;
        text.resizeTextForBestFit = true;
        text.resizeTextMinSize = 16;
        text.resizeTextMaxSize = fontSize;
        return text;
    }

    private Button CreateButton(Transform parent, string label, Vector2 position, UnityEngine.Events.UnityAction action)
    {
        GameObject buttonObject = new GameObject(label + " Button");
        buttonObject.transform.SetParent(parent, false);

        RectTransform rect = buttonObject.AddComponent<RectTransform>();
        rect.sizeDelta = new Vector2(240f, 68f);
        rect.anchoredPosition = position;

        Image image = buttonObject.AddComponent<Image>();
        image.color = new Color(0.92f, 0.12f, 0.08f, 0.96f);

        Button button = buttonObject.AddComponent<Button>();
        button.targetGraphic = image;
        button.onClick.AddListener(action);

        ColorBlock colors = button.colors;
        colors.normalColor = new Color(0.92f, 0.12f, 0.08f, 0.96f);
        colors.highlightedColor = new Color(1f, 0.28f, 0.2f, 1f);
        colors.pressedColor = new Color(0.68f, 0.05f, 0.04f, 1f);
        colors.selectedColor = colors.highlightedColor;
        button.colors = colors;

        CreateText(buttonObject.transform, label, 28, FontStyle.Bold, Vector2.zero, rect.sizeDelta);
        return button;
    }

    private static Sprite CreateVignetteSprite(int size)
    {
        Texture2D texture = new Texture2D(size, size, TextureFormat.RGBA32, false);
        Vector2 center = new Vector2((size - 1) * 0.5f, (size - 1) * 0.5f);
        float maxDistance = center.magnitude;

        for (int y = 0; y < size; y++)
        {
            for (int x = 0; x < size; x++)
            {
                float distance = Vector2.Distance(new Vector2(x, y), center) / maxDistance;
                float alpha = Mathf.SmoothStep(0.05f, 1f, distance);
                texture.SetPixel(x, y, new Color(1f, 1f, 1f, alpha));
            }
        }

        texture.Apply();
        return Sprite.Create(texture, new Rect(0f, 0f, size, size), new Vector2(0.5f, 0.5f), size);
    }

    private static void EnsureEventSystem()
    {
        if (FindFirstObjectByType<EventSystem>() != null)
        {
            return;
        }

        GameObject eventSystemObject = new GameObject("EventSystem");
        eventSystemObject.AddComponent<EventSystem>();
#if ENABLE_INPUT_SYSTEM
        InputSystemUIInputModule inputModule = eventSystemObject.AddComponent<InputSystemUIInputModule>();
        InputActionAsset actions = ScriptableObject.CreateInstance<InputActionAsset>();
        InputActionMap ui = new InputActionMap("UI");

        InputAction point = ui.AddAction("Point", InputActionType.PassThrough, "<Pointer>/position");
        InputAction click = ui.AddAction("Click", InputActionType.PassThrough, "<Pointer>/press");
        InputAction submit = ui.AddAction("Submit", InputActionType.Button, "<Keyboard>/enter");
        submit.AddBinding("<Keyboard>/space");

        actions.AddActionMap(ui);
        actions.Enable();

        inputModule.actionsAsset = actions;
        inputModule.point = InputActionReference.Create(point);
        inputModule.leftClick = InputActionReference.Create(click);
        inputModule.submit = InputActionReference.Create(submit);
#else
        eventSystemObject.AddComponent<StandaloneInputModule>();
#endif
    }
}
