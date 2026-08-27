using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
#endif

public class LakeFallSystem : MonoBehaviour
{
    private bool playerIsFalling;
    private Image overlay;
    private GameObject lostGroup;

    public static LakeFallSystem EnsureExists()
    {
        LakeFallSystem system = FindFirstObjectByType<LakeFallSystem>();
        if (system != null)
        {
            return system;
        }

        GameObject systemObject = new GameObject("Lake Fall System");
        return systemObject.AddComponent<LakeFallSystem>();
    }

    public void DropPlayer(GameObject player)
    {
        if (playerIsFalling || player == null)
        {
            return;
        }

        StartCoroutine(DropPlayerRoutine(player));
    }

    private void Awake()
    {
        BuildUI();
    }

    private IEnumerator DropPlayerRoutine(GameObject player)
    {
        playerIsFalling = true;

        ArcadeCarController controller = player.GetComponent<ArcadeCarController>();
        if (controller != null)
        {
            controller.enabled = false;
        }

        Rigidbody rb = player.GetComponent<Rigidbody>();
        if (rb != null)
        {
            rb.linearVelocity *= 0.25f;
            rb.angularVelocity = Vector3.zero;
            rb.useGravity = true;
        }

        float duration = 0.85f;
        float timer = 0f;
        Vector3 start = player.transform.position;
        Vector3 end = start + Vector3.down * 3.2f;

        while (timer < duration)
        {
            timer += Time.deltaTime;
            float progress = Mathf.Clamp01(timer / duration);
            player.transform.position = Vector3.Lerp(start, end, progress * progress);
            overlay.color = new Color(0f, 0.24f, 0.55f, Mathf.Lerp(0.15f, 0.62f, progress));
            yield return null;
        }

        Time.timeScale = 0f;
        lostGroup.SetActive(true);
    }

    private void RestartGame()
    {
        Time.timeScale = 1f;
        Scene activeScene = SceneManager.GetActiveScene();
        SceneManager.LoadScene(activeScene.buildIndex);
        Destroy(gameObject);
    }

    private void BuildUI()
    {
        EnsureEventSystem();

        Canvas canvas = gameObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 112;

        CanvasScaler scaler = gameObject.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920f, 1080f);
        scaler.matchWidthOrHeight = 0.5f;

        gameObject.AddComponent<GraphicRaycaster>();

        overlay = CreateImage("Lake Overlay", transform, new Color(0f, 0.24f, 0.55f, 0f));
        overlay.raycastTarget = false;

        lostGroup = CreateFullScreenGroup("Lake Lost Screen");
        Image background = CreateImage("Lake Lost Background", lostGroup.transform, new Color(0.01f, 0.03f, 0.06f, 0.9f));
        background.raycastTarget = true;
        CreateText(lostGroup.transform, "SUNK", 92, FontStyle.Bold, new Vector2(0f, 115f), new Vector2(900f, 130f));
        CreateText(lostGroup.transform, "You drove into a lake", 34, FontStyle.Normal, new Vector2(0f, 20f), new Vector2(760f, 70f));
        CreateButton(lostGroup.transform, "RESTART", new Vector2(0f, -105f), RestartGame);
        lostGroup.SetActive(false);
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
        image.color = new Color(0.05f, 0.36f, 0.72f, 0.96f);

        Button button = buttonObject.AddComponent<Button>();
        button.targetGraphic = image;
        button.onClick.AddListener(action);

        ColorBlock colors = button.colors;
        colors.normalColor = new Color(0.05f, 0.36f, 0.72f, 0.96f);
        colors.highlightedColor = new Color(0.12f, 0.5f, 0.9f, 1f);
        colors.pressedColor = new Color(0.02f, 0.2f, 0.48f, 1f);
        colors.selectedColor = colors.highlightedColor;
        button.colors = colors;

        CreateText(buttonObject.transform, label, 28, FontStyle.Bold, Vector2.zero, rect.sizeDelta);
        return button;
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
