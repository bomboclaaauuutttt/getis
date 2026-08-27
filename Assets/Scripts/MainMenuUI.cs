using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
#endif

public class MainMenuUI : MonoBehaviour
{
    private const string RedCarCredit = "Red Car by J-Toastie [CC-BY 3.0] via Poly Pizza";
    private const string PoliceCarCredit = "Police Car by Quaternius via Poly Pizza";
    private const string RedCarUrl = "https://poly.pizza/m/dVLJ5CjB0h";
    private const string RedCarAuthorUrl = "https://poly.pizza/u/J-Toastie";
    private const string PoliceCarUrl = "https://poly.pizza/m/BwwnUrWGmV";
    private const string PoliceCarAuthorUrl = "https://poly.pizza/u/Quaternius";
    private const string LicenseUrl = "https://creativecommons.org/licenses/by/3.0/";

    private GameObject mainPanel;
    private GameObject creditsPanel;
    private InputField roomInput;
    private Text multiplayerStatusText;
    private float previousTimeScale = 1f;

    public static void EnsureExists()
    {
        if (FindFirstObjectByType<MainMenuUI>() != null)
        {
            return;
        }

        GameObject menuObject = new GameObject("Main Menu");
        DontDestroyOnLoad(menuObject);
        menuObject.AddComponent<MainMenuUI>();
    }

    private void Awake()
    {
        BuildMenu();
        ShowMainMenu();
    }

    private void BuildMenu()
    {
        EnsureEventSystem();

        Canvas canvas = gameObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 100;

        CanvasScaler scaler = gameObject.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1920f, 1080f);
        scaler.matchWidthOrHeight = 0.5f;

        gameObject.AddComponent<GraphicRaycaster>();

        Image background = gameObject.AddComponent<Image>();
        background.color = new Color(0.03f, 0.035f, 0.04f, 0.86f);

        mainPanel = CreatePanel("Main Panel");
        CreateText(mainPanel.transform, "MINI GTA", 86, FontStyle.Bold, new Vector2(0f, 180f), new Vector2(760f, 120f));
        CreateText(mainPanel.transform, "Top-down chase prototype", 30, FontStyle.Normal, new Vector2(0f, 95f), new Vector2(760f, 70f));
        CreateButton(mainPanel.transform, "START", new Vector2(0f, -25f), StartGame);
        roomInput = CreateInput(mainPanel.transform, "koulu", new Vector2(0f, -110f));
        CreateButton(mainPanel.transform, "JOIN ROOM", new Vector2(-125f, -195f), JoinMultiplayer);
        CreateButton(mainPanel.transform, "LEAVE", new Vector2(125f, -195f), LeaveMultiplayer);
        multiplayerStatusText = CreateText(mainPanel.transform, "Offline", 22, FontStyle.Normal, new Vector2(0f, -260f), new Vector2(760f, 44f));
        CreateButton(mainPanel.transform, "CREDITS", new Vector2(-125f, -325f), ShowCredits);
        CreateButton(mainPanel.transform, "QUIT", new Vector2(125f, -325f), QuitGame);

        creditsPanel = CreatePanel("Credits Panel");
        CreateText(creditsPanel.transform, "CREDITS", 64, FontStyle.Bold, new Vector2(0f, 210f), new Vector2(760f, 90f));
        CreateText(creditsPanel.transform, RedCarCredit, 26, FontStyle.Normal, new Vector2(0f, 110f), new Vector2(980f, 70f));
        CreateText(creditsPanel.transform, PoliceCarCredit, 26, FontStyle.Normal, new Vector2(0f, 35f), new Vector2(980f, 70f));
        CreateButton(creditsPanel.transform, "RED CAR", new Vector2(-390f, -80f), () => Application.OpenURL(RedCarUrl));
        CreateButton(creditsPanel.transform, "J-TOASTIE", new Vector2(-130f, -80f), () => Application.OpenURL(RedCarAuthorUrl));
        CreateButton(creditsPanel.transform, "POLICE CAR", new Vector2(130f, -80f), () => Application.OpenURL(PoliceCarUrl));
        CreateButton(creditsPanel.transform, "QUATERNIUS", new Vector2(390f, -80f), () => Application.OpenURL(PoliceCarAuthorUrl));
        CreateButton(creditsPanel.transform, "CC-BY 3.0", new Vector2(0f, -170f), () => Application.OpenURL(LicenseUrl));
        CreateButton(creditsPanel.transform, "BACK", new Vector2(0f, -220f), ShowMainMenu);
    }

    private GameObject CreatePanel(string panelName)
    {
        GameObject panel = new GameObject(panelName);
        panel.transform.SetParent(transform, false);

        RectTransform rect = panel.AddComponent<RectTransform>();
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;

        return panel;
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

    private InputField CreateInput(Transform parent, string value, Vector2 position)
    {
        GameObject inputObject = new GameObject("Room Input");
        inputObject.transform.SetParent(parent, false);

        RectTransform rect = inputObject.AddComponent<RectTransform>();
        rect.sizeDelta = new Vector2(320f, 58f);
        rect.anchoredPosition = position;

        Image image = inputObject.AddComponent<Image>();
        image.color = new Color(0.08f, 0.09f, 0.1f, 0.94f);

        InputField input = inputObject.AddComponent<InputField>();
        input.targetGraphic = image;

        Text inputText = CreateText(inputObject.transform, value, 25, FontStyle.Bold, Vector2.zero, new Vector2(285f, 48f));
        inputText.alignment = TextAnchor.MiddleLeft;
        inputText.color = Color.white;
        input.textComponent = inputText;
        input.text = value;

        Text placeholder = CreateText(inputObject.transform, "room code", 25, FontStyle.Normal, Vector2.zero, new Vector2(285f, 48f));
        placeholder.alignment = TextAnchor.MiddleLeft;
        placeholder.color = new Color(1f, 1f, 1f, 0.34f);
        input.placeholder = placeholder;

        return input;
    }

    private Button CreateButton(Transform parent, string label, Vector2 position, UnityEngine.Events.UnityAction action)
    {
        GameObject buttonObject = new GameObject(label + " Button");
        buttonObject.transform.SetParent(parent, false);

        RectTransform rect = buttonObject.AddComponent<RectTransform>();
        rect.sizeDelta = new Vector2(220f, 64f);
        rect.anchoredPosition = position;

        Image image = buttonObject.AddComponent<Image>();
        image.color = new Color(0.92f, 0.18f, 0.12f, 0.96f);

        Button button = buttonObject.AddComponent<Button>();
        button.targetGraphic = image;
        button.onClick.AddListener(action);

        ColorBlock colors = button.colors;
        colors.normalColor = new Color(0.92f, 0.18f, 0.12f, 0.96f);
        colors.highlightedColor = new Color(1f, 0.32f, 0.22f, 1f);
        colors.pressedColor = new Color(0.72f, 0.08f, 0.06f, 1f);
        colors.selectedColor = colors.highlightedColor;
        button.colors = colors;

        CreateText(buttonObject.transform, label, 28, FontStyle.Bold, Vector2.zero, rect.sizeDelta);
        return button;
    }

    private void ShowMainMenu()
    {
        previousTimeScale = Time.timeScale <= 0f ? 1f : Time.timeScale;
        Time.timeScale = 0f;
        gameObject.SetActive(true);
        mainPanel.SetActive(true);
        creditsPanel.SetActive(false);
    }

    private void Update()
    {
        if (multiplayerStatusText == null)
        {
            return;
        }

        SimplePhotonMultiplayer multiplayer = FindFirstObjectByType<SimplePhotonMultiplayer>();
        multiplayerStatusText.text = multiplayer != null ? multiplayer.Status : "Offline";
    }

    private void StartGame()
    {
        Time.timeScale = previousTimeScale;
        gameObject.SetActive(false);
    }

    private void ShowCredits()
    {
        mainPanel.SetActive(false);
        creditsPanel.SetActive(true);
    }

    private void JoinMultiplayer()
    {
        ArcadeCarController car = FindFirstObjectByType<ArcadeCarController>();
        if (car == null)
        {
            return;
        }

        Time.timeScale = previousTimeScale;
        SimplePhotonMultiplayer multiplayer = SimplePhotonMultiplayer.EnsureExists(car);
        multiplayer.JoinOrCreateRoom(roomInput != null ? roomInput.text : "koulu");
        gameObject.SetActive(false);
    }

    private void LeaveMultiplayer()
    {
        SimplePhotonMultiplayer multiplayer = FindFirstObjectByType<SimplePhotonMultiplayer>();
        if (multiplayer != null)
        {
            multiplayer.LeaveRoom();
        }
    }

    private void QuitGame()
    {
#if UNITY_EDITOR
        UnityEditor.EditorApplication.isPlaying = false;
#else
        Application.Quit();
#endif
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
        InputAction scrollWheel = ui.AddAction("ScrollWheel", InputActionType.PassThrough, "<Mouse>/scroll");
        InputAction move = ui.AddAction("Move", InputActionType.PassThrough);
        move.AddCompositeBinding("2DVector")
            .With("Up", "<Keyboard>/w")
            .With("Up", "<Keyboard>/upArrow")
            .With("Down", "<Keyboard>/s")
            .With("Down", "<Keyboard>/downArrow")
            .With("Left", "<Keyboard>/a")
            .With("Left", "<Keyboard>/leftArrow")
            .With("Right", "<Keyboard>/d")
            .With("Right", "<Keyboard>/rightArrow");
        InputAction submit = ui.AddAction("Submit", InputActionType.Button, "<Keyboard>/enter");
        submit.AddBinding("<Keyboard>/space");
        InputAction cancel = ui.AddAction("Cancel", InputActionType.Button, "<Keyboard>/escape");

        actions.AddActionMap(ui);
        actions.Enable();

        inputModule.actionsAsset = actions;
        inputModule.point = InputActionReference.Create(point);
        inputModule.leftClick = InputActionReference.Create(click);
        inputModule.scrollWheel = InputActionReference.Create(scrollWheel);
        inputModule.move = InputActionReference.Create(move);
        inputModule.submit = InputActionReference.Create(submit);
        inputModule.cancel = InputActionReference.Create(cancel);
#else
        eventSystemObject.AddComponent<StandaloneInputModule>();
#endif
        DontDestroyOnLoad(eventSystemObject);
    }
}
