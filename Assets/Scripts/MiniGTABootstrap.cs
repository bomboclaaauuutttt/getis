using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

#if UNITY_EDITOR
using UnityEditor;
#endif

public static class MiniGTABootstrap
{
    private static readonly Vector3 PlayerSpawnPosition = new Vector3(0f, 0.1f, -8f);
    private static readonly Quaternion PlayerSpawnRotation = Quaternion.identity;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    private static void CreatePrototypeScene()
    {
        Scene activeScene = SceneManager.GetActiveScene();
        if (!string.IsNullOrEmpty(activeScene.path) && activeScene.path.StartsWith("Assets/Photon"))
        {
            return;
        }

        ArcadeCarController existingCar = Object.FindFirstObjectByType<ArcadeCarController>();
        if (existingCar != null)
        {
            MovePlayerToSpawn(existingCar.gameObject);
            RemoveLegacyPrototypeObjects();
            EnsureImportedVisual(existingCar.gameObject, new[] { "car", "red car" }, true, true);
            EnsureVehicleCollisionPushback(existingCar.gameObject);
            EnsureDrivingEffects(existingCar.gameObject);
            EnsureEndlessGround(existingCar.transform);
            EnsurePoliceChase(existingCar.transform);
            ArrestSystem.EnsureExists(existingCar.gameObject);
            DrivingMoneySystem.EnsureExists(existingCar);
            SimplePhotonMultiplayer.EnsureExists(existingCar);
            MinimapUI.EnsureExists(existingCar.transform);
            SetupCamera(existingCar.transform);
            SetupLight();
            MainMenuUI.EnsureExists();
            return;
        }

        RemoveLegacyPrototypeObjects();
        GameObject car = CreatePlayerCar();
        EnsureEndlessGround(car.transform);
        EnsurePoliceChase(car.transform);
        ArrestSystem.EnsureExists(car);
        ArcadeCarController carController = car.GetComponent<ArcadeCarController>();
        DrivingMoneySystem.EnsureExists(carController);
        SimplePhotonMultiplayer.EnsureExists(carController);
        MinimapUI.EnsureExists(car.transform);
        SetupCamera(car.transform);
        SetupLight();
        MainMenuUI.EnsureExists();
    }

    public static void CreatePrototypeSceneInEditor()
    {
        CreatePrototypeScene();
    }

    public static GameObject CreatePoliceCarForChase(Transform target, Vector3 position, Vector3 chaseOffset)
    {
        Material fallbackBodyMaterial = CreateMaterial("Police Car Black", new Color(0.03f, 0.035f, 0.04f));
        Material fallbackCabinMaterial = CreateMaterial("Police Car White", new Color(0.9f, 0.9f, 0.86f));
        Material fallbackWheelMaterial = CreateMaterial("Police Wheel Rubber", new Color(0.02f, 0.02f, 0.025f));
        GameObject policeCar = CreateCar("Cop Car", position, false, false, new[] { "cop", "cop car", "police car" }, fallbackBodyMaterial, fallbackCabinMaterial, fallbackWheelMaterial);
        EnsurePoliceVisual(policeCar);
        PoliceCarAI ai = policeCar.AddComponent<PoliceCarAI>();
        ai.SetTarget(target);
        ai.SetChaseOffset(chaseOffset);
        return policeCar;
    }

    public static void EnsurePoliceVisual(GameObject policeCar)
    {
        EnsureImportedVisual(policeCar, new[] { "cop", "cop car", "police car" }, false, false);
    }

    public static GameObject CreateRemoteCarVisual(Vector3 position, Quaternion rotation)
    {
        Material bodyMaterial = CreateMaterial("Remote Player Blue", new Color(0.08f, 0.18f, 0.92f));
        Material cabinMaterial = CreateMaterial("Remote Cabin", new Color(0.08f, 0.12f, 0.16f));
        Material wheelMaterial = CreateMaterial("Remote Wheel Rubber", new Color(0.02f, 0.02f, 0.025f));
        GameObject remoteCar = CreateCar("Remote Player Car", position, false, true, new[] { "car", "red car" }, bodyMaterial, cabinMaterial, wheelMaterial);
        remoteCar.transform.rotation = rotation;

        Rigidbody rb = remoteCar.GetComponent<Rigidbody>();
        if (rb != null)
        {
            rb.isKinematic = true;
            rb.detectCollisions = false;
        }

        Collider collider = remoteCar.GetComponent<Collider>();
        if (collider != null)
        {
            DestroyObject(collider);
        }

        return remoteCar;
    }

    private static Material CreateMaterial(string name, Color color)
    {
        Shader shader = Shader.Find("Standard");
        if (shader == null)
        {
            shader = Shader.Find("Universal Render Pipeline/Lit");
        }

        if (shader == null)
        {
            shader = Shader.Find("Sprites/Default");
        }

        Material material = new Material(shader);
        material.name = name;
        material.color = color;
        return material;
    }

    private static GameObject CreatePlayerCar()
    {
        Material fallbackBodyMaterial = CreateMaterial("Player Car Blue", new Color(0.05f, 0.28f, 0.9f));
        Material fallbackCabinMaterial = CreateMaterial("Car Cabin", new Color(0.08f, 0.12f, 0.16f));
        Material fallbackWheelMaterial = CreateMaterial("Wheel Rubber", new Color(0.02f, 0.02f, 0.025f));
        return CreateCar("Player Car", PlayerSpawnPosition, true, true, new[] { "car", "red car" }, fallbackBodyMaterial, fallbackCabinMaterial, fallbackWheelMaterial);
    }

    private static void MovePlayerToSpawn(GameObject player)
    {
        player.transform.SetPositionAndRotation(PlayerSpawnPosition, PlayerSpawnRotation);

        Rigidbody rb = player.GetComponent<Rigidbody>();
        if (rb == null)
        {
            return;
        }

        rb.linearVelocity = Vector3.zero;
        rb.angularVelocity = Vector3.zero;
    }

    private static void EnsureEndlessGround(Transform target)
    {
        EndlessFlatGround ground = Object.FindFirstObjectByType<EndlessFlatGround>();
        if (ground == null)
        {
            GameObject groundObject = new GameObject("Endless Flat Ground");
            ground = groundObject.AddComponent<EndlessFlatGround>();
        }

        ground.SetTarget(target);
    }

    private static void RemoveLegacyPrototypeObjects()
    {
        DestroyNamedObject("Flat Map");
        DestroyNamedObject("Main Road");
        DestroyNamedObject("Cross Road");
        DestroyNamedObject("North Barrier");
        DestroyNamedObject("South Barrier");
        DestroyNamedObject("East Barrier");
        DestroyNamedObject("West Barrier");
    }

    private static void DestroyNamedObject(string objectName)
    {
        GameObject found = GameObject.Find(objectName);
        if (found != null)
        {
            DestroyObject(found);
        }
    }

    private static void EnsurePoliceChase(Transform target)
    {
        PoliceChaseManager.EnsureExists(target);
    }

    private static void EnsurePoliceCar(Transform target)
    {
        PoliceCarAI existingPolice = Object.FindFirstObjectByType<PoliceCarAI>();
        if (existingPolice != null)
        {
            EnsureImportedVisual(existingPolice.gameObject, new[] { "cop", "cop car", "police car" }, false, false);
            existingPolice.SetTarget(target);
            return;
        }

        CreatePoliceCarForChase(target, target.position + new Vector3(0f, 0f, 18f), Vector3.zero);
    }

    private static GameObject CreateCar(string name, Vector3 position, bool playerControlled, bool flipImportedVisual, string[] assetSearchNames, Material bodyMaterial, Material cabinMaterial, Material wheelMaterial)
    {
        GameObject car = new GameObject(name);
        car.transform.position = position;
        car.transform.rotation = Quaternion.Euler(0f, 0f, 0f);
        if (playerControlled)
        {
            car.tag = "Player";
        }

        Rigidbody rb = car.AddComponent<Rigidbody>();
        rb.mass = 900f;

        BoxCollider collider = car.AddComponent<BoxCollider>();
        collider.center = new Vector3(0f, 0.35f, 0f);
        collider.size = new Vector3(1.8f, 0.9f, 3.6f);
        EnsureVehicleCollisionPushback(car);

        if (playerControlled)
        {
            car.AddComponent<ArcadeCarController>();
        }

        GameObject visualRoot = new GameObject("Visuals");
        visualRoot.transform.SetParent(car.transform, false);

        if (!TryCreateImportedVehicleVisual(assetSearchNames, visualRoot.transform, playerControlled, flipImportedVisual))
        {
            Debug.LogWarning(name + " asset was not found by name, using fallback prototype car visual.");
            CreateFallbackVehicleVisual(visualRoot.transform, playerControlled, bodyMaterial, cabinMaterial, wheelMaterial);
        }

        if (playerControlled)
        {
            EnsureDrivingEffects(car, visualRoot.transform);
        }

        return car;
    }

    private static void EnsureVehicleCollisionPushback(GameObject car)
    {
        if (car.GetComponent<VehicleCollisionPushback>() == null)
        {
            car.AddComponent<VehicleCollisionPushback>();
        }
    }

    private static void CreateFallbackVehicleVisual(Transform visualRoot, bool playerControlled, Material bodyMaterial, Material cabinMaterial, Material wheelMaterial)
    {
        GameObject body = GameObject.CreatePrimitive(PrimitiveType.Cube);
        body.name = "Body";
        body.transform.SetParent(visualRoot, false);
        body.transform.localPosition = new Vector3(0f, 0.35f, 0f);
        body.transform.localScale = new Vector3(1.8f, 0.55f, 3.4f);
        body.GetComponent<Renderer>().material = bodyMaterial;
        DestroyObject(body.GetComponent<Collider>());

        GameObject cabin = GameObject.CreatePrimitive(PrimitiveType.Cube);
        cabin.name = "Cabin";
        cabin.transform.SetParent(visualRoot, false);
        cabin.transform.localPosition = new Vector3(0f, 0.78f, -0.25f);
        cabin.transform.localScale = playerControlled ? new Vector3(1.3f, 0.45f, 1.35f) : new Vector3(1.35f, 0.42f, 1.45f);
        cabin.GetComponent<Renderer>().material = cabinMaterial;
        DestroyObject(cabin.GetComponent<Collider>());

        CreateWheel(visualRoot, new Vector3(-1.05f, 0.1f, 1.1f), wheelMaterial);
        CreateWheel(visualRoot, new Vector3(1.05f, 0.1f, 1.1f), wheelMaterial);
        CreateWheel(visualRoot, new Vector3(-1.05f, 0.1f, -1.1f), wheelMaterial);
        CreateWheel(visualRoot, new Vector3(1.05f, 0.1f, -1.1f), wheelMaterial);
    }

    private static bool TryCreateImportedVehicleVisual(string[] assetSearchNames, Transform visualRoot, bool playerControlled, bool flipForward)
    {
        GameObject asset = FindVehicleAsset(assetSearchNames);
        if (asset == null)
        {
            return false;
        }

        GameObject visual = Object.Instantiate(asset, visualRoot);
        Debug.Log("Using imported vehicle asset: " + asset.name);
        visual.name = asset.name;
        visual.transform.localPosition = Vector3.zero;
        visual.transform.localRotation = flipForward ? Quaternion.Euler(0f, 180f, 0f) : Quaternion.identity;
        visual.transform.localScale = Vector3.one;
        RemoveColliders(visual.transform);
        FitVisualToCollider(visual.transform);
        return true;
    }

    private static void EnsureImportedVisual(GameObject car, string[] assetSearchNames, bool playerControlled, bool flipForward)
    {
        GameObject asset = FindVehicleAsset(assetSearchNames);
        if (asset == null)
        {
            return;
        }

        Transform visualRoot = EnsureVisualRoot(car, null);
        Transform existingVisual = visualRoot.Find(asset.name);
        if (existingVisual != null)
        {
            existingVisual.localRotation = flipForward ? Quaternion.Euler(0f, 180f, 0f) : Quaternion.identity;
            FitVisualToCollider(existingVisual);
            return;
        }

        ClearVisualRoot(visualRoot);

        GameObject visual = Object.Instantiate(asset, visualRoot);
        Debug.Log("Updated vehicle visual to imported asset: " + asset.name);
        visual.name = asset.name;
        visual.transform.localPosition = Vector3.zero;
        visual.transform.localRotation = flipForward ? Quaternion.Euler(0f, 180f, 0f) : Quaternion.identity;
        visual.transform.localScale = Vector3.one;
        RemoveColliders(visual.transform);
        FitVisualToCollider(visual.transform);
    }

    private static void ClearVisualRoot(Transform visualRoot)
    {
        Transform[] children = new Transform[visualRoot.childCount];
        for (int i = 0; i < visualRoot.childCount; i++)
        {
            children[i] = visualRoot.GetChild(i);
        }

        foreach (Transform child in children)
        {
            DestroyObject(child.gameObject);
        }
    }

    private static GameObject FindVehicleAsset(string[] searchNames)
    {
        foreach (string searchName in searchNames)
        {
            GameObject resource = LoadVehicleResource(searchName);
            if (resource != null)
            {
                return resource;
            }
        }

#if UNITY_EDITOR
        foreach (string searchName in searchNames)
        {
            string[] guids = AssetDatabase.FindAssets(searchName + " t:GameObject");
            foreach (string guid in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                GameObject asset = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (asset != null && IsExactVehicleNameMatch(asset.name, searchName))
                {
                    return asset;
                }
            }
        }

        foreach (string searchName in searchNames)
        {
            string[] guids = AssetDatabase.FindAssets(searchName + " t:GameObject");
            foreach (string guid in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                GameObject asset = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (asset != null && IsVehicleNameMatch(asset.name, searchName))
                {
                    return asset;
                }
            }
        }
#endif

        return null;
    }

    private static GameObject LoadVehicleResource(string searchName)
    {
        string[] resourcePaths =
        {
            searchName,
            "Vehicles/" + searchName,
            "Vehicles/" + ToTitleCaseVehicleName(searchName)
        };

        foreach (string path in resourcePaths)
        {
            GameObject resource = Resources.Load<GameObject>(path);
            if (resource != null)
            {
                return resource;
            }
        }

        return null;
    }

    private static bool IsExactVehicleNameMatch(string assetName, string searchName)
    {
        return NormalizeVehicleName(assetName) == NormalizeVehicleName(searchName);
    }

    private static bool IsVehicleNameMatch(string assetName, string searchName)
    {
        string normalizedAsset = NormalizeVehicleName(assetName);
        string normalizedSearch = NormalizeVehicleName(searchName);
        return normalizedAsset == normalizedSearch || normalizedAsset.Contains(normalizedSearch);
    }

    private static string NormalizeVehicleName(string value)
    {
        return value.ToLowerInvariant().Replace("_", " ").Replace("-", " ").Trim();
    }

    private static string ToTitleCaseVehicleName(string value)
    {
        string normalized = NormalizeVehicleName(value);
        if (normalized == "cop" || normalized == "cop car" || normalized == "police car")
        {
            return "Cop";
        }

        if (normalized == "car" || normalized == "red car")
        {
            return "car";
        }

        return value;
    }

    private static void FitVisualToCollider(Transform visual)
    {
        Renderer[] renderers = visual.GetComponentsInChildren<Renderer>();
        if (renderers.Length == 0)
        {
            return;
        }

        Bounds bounds = renderers[0].bounds;
        for (int i = 1; i < renderers.Length; i++)
        {
            bounds.Encapsulate(renderers[i].bounds);
        }

        float longestHorizontalSide = Mathf.Max(bounds.size.x, bounds.size.z);
        if (longestHorizontalSide <= 0.01f)
        {
            return;
        }

        float scale = 3.4f / longestHorizontalSide;
        visual.localScale *= scale;

        bounds = renderers[0].bounds;
        for (int i = 1; i < renderers.Length; i++)
        {
            bounds.Encapsulate(renderers[i].bounds);
        }

        Vector3 localCenter = visual.parent.InverseTransformPoint(bounds.center);
        visual.localPosition -= new Vector3(localCenter.x, bounds.min.y - 0.02f, localCenter.z);
    }

    private static void RemoveColliders(Transform root)
    {
        Collider[] colliders = root.GetComponentsInChildren<Collider>();
        foreach (Collider collider in colliders)
        {
            DestroyObject(collider);
        }
    }

    private static void EnsureDrivingEffects(GameObject car, Transform visualRoot = null)
    {
        visualRoot = EnsureVisualRoot(car, visualRoot);

        ParticleSystem exhaust = CreateParticleSystem(
            "Exhaust Smoke",
            car.transform,
            new Vector3(0f, 0.35f, -1.95f),
            new Color(0.58f, 0.62f, 0.64f, 0.42f),
            0.75f,
            0.25f);

        ParticleSystem leftDust = CreateParticleSystem(
            "Left Tire Dust",
            car.transform,
            new Vector3(-0.95f, 0.12f, -1.25f),
            new Color(0.62f, 0.58f, 0.48f, 0.48f),
            0.45f,
            0.4f);

        ParticleSystem rightDust = CreateParticleSystem(
            "Right Tire Dust",
            car.transform,
            new Vector3(0.95f, 0.12f, -1.25f),
            new Color(0.62f, 0.58f, 0.48f, 0.48f),
            0.45f,
            0.4f);

        CarEffects effects = car.GetComponent<CarEffects>();
        if (effects == null)
        {
            effects = car.AddComponent<CarEffects>();
        }

        effects.Configure(visualRoot, exhaust, leftDust, rightDust);
    }

    private static Transform EnsureVisualRoot(GameObject car, Transform visualRoot)
    {
        if (visualRoot != null && visualRoot != car.transform)
        {
            return visualRoot;
        }

        Transform existingVisuals = car.transform.Find("Visuals");
        if (existingVisuals != null)
        {
            return existingVisuals;
        }

        GameObject visuals = new GameObject("Visuals");
        visuals.transform.SetParent(car.transform, false);

        Transform[] children = new Transform[car.transform.childCount];
        int childCount = car.transform.childCount;
        for (int i = 0; i < childCount; i++)
        {
            children[i] = car.transform.GetChild(i);
        }

        for (int i = 0; i < childCount; i++)
        {
            Transform child = children[i];
            if (child == null || child == visuals.transform || child.GetComponent<ParticleSystem>() != null)
            {
                continue;
            }

            if (child.GetComponent<Renderer>() != null)
            {
                child.SetParent(visuals.transform, true);
            }
        }

        return visuals.transform;
    }

    private static void CreateWheel(Transform parent, Vector3 localPosition, Material material)
    {
        GameObject wheel = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        wheel.name = "Wheel";
        wheel.transform.SetParent(parent, false);
        wheel.transform.localPosition = localPosition;
        wheel.transform.localRotation = Quaternion.Euler(0f, 0f, 90f);
        wheel.transform.localScale = new Vector3(0.32f, 0.18f, 0.32f);
        wheel.GetComponent<Renderer>().material = material;
        DestroyObject(wheel.GetComponent<Collider>());
    }

    private static ParticleSystem CreateParticleSystem(string name, Transform parent, Vector3 localPosition, Color color, float lifetime, float startSize)
    {
        Transform existingEffect = parent.Find(name);
        if (existingEffect != null && existingEffect.TryGetComponent(out ParticleSystem existingParticles))
        {
            return existingParticles;
        }

        GameObject effectObject = new GameObject(name);
        effectObject.transform.SetParent(parent, false);
        effectObject.transform.localPosition = localPosition;
        effectObject.transform.localRotation = Quaternion.Euler(-8f, 180f, 0f);

        ParticleSystem particles = effectObject.AddComponent<ParticleSystem>();
        ParticleSystem.MainModule main = particles.main;
        main.loop = true;
        main.startLifetime = lifetime;
        main.startSpeed = 1.8f;
        main.startSize = startSize;
        main.startColor = color;
        main.simulationSpace = ParticleSystemSimulationSpace.World;

        ParticleSystem.EmissionModule emission = particles.emission;
        emission.rateOverTime = 0f;

        ParticleSystem.ShapeModule shape = particles.shape;
        shape.shapeType = ParticleSystemShapeType.Cone;
        shape.angle = 18f;
        shape.radius = 0.12f;

        ParticleSystem.VelocityOverLifetimeModule velocity = particles.velocityOverLifetime;
        velocity.enabled = true;
        velocity.space = ParticleSystemSimulationSpace.Local;
        velocity.z = 1.2f;
        velocity.y = 0.35f;

        ParticleSystem.SizeOverLifetimeModule size = particles.sizeOverLifetime;
        size.enabled = true;
        AnimationCurve sizeCurve = new AnimationCurve(
            new Keyframe(0f, 0.25f),
            new Keyframe(0.35f, 1f),
            new Keyframe(1f, 0f));
        size.size = new ParticleSystem.MinMaxCurve(1f, sizeCurve);

        ParticleSystemRenderer renderer = particles.GetComponent<ParticleSystemRenderer>();
        renderer.material = CreateParticleMaterial(color);

        return particles;
    }

    private static Material CreateParticleMaterial(Color color)
    {
        Shader shader = Shader.Find("Particles/Standard Unlit");
        if (shader == null)
        {
            shader = Shader.Find("Sprites/Default");
        }

        Material material = new Material(shader);
        material.name = "Soft Driving Particle";
        material.color = color;
        return material;
    }

    private static void SetupCamera(Transform target)
    {
        Camera camera = Camera.main;
        if (camera == null)
        {
            GameObject cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            camera = cameraObject.AddComponent<Camera>();
            cameraObject.AddComponent<AudioListener>();
        }

        camera.fieldOfView = 55f;
        camera.nearClipPlane = 0.1f;
        camera.farClipPlane = 500f;

        CameraFollow follow = camera.GetComponent<CameraFollow>();
        if (follow == null)
        {
            follow = camera.gameObject.AddComponent<CameraFollow>();
        }

        follow.SetTarget(target);

        CameraOcclusionFader occlusionFader = camera.GetComponent<CameraOcclusionFader>();
        if (occlusionFader == null)
        {
            occlusionFader = camera.gameObject.AddComponent<CameraOcclusionFader>();
        }

        occlusionFader.SetTarget(target);
    }

    private static void SetupLight()
    {
        Light sun = null;
        Light[] lights = Object.FindObjectsByType<Light>(FindObjectsSortMode.None);
        foreach (Light light in lights)
        {
            if (light != null && light.type == LightType.Directional)
            {
                sun = light;
                break;
            }
        }

        if (sun == null)
        {
            GameObject sunObject = new GameObject("Directional Light");
            sun = sunObject.AddComponent<Light>();
            sun.type = LightType.Directional;
        }

        sun.name = "Sun";
        sun.color = new Color(1f, 0.88f, 0.68f);
        sun.transform.rotation = Quaternion.Euler(48f, -32f, 0f);
        sun.intensity = 1.45f;
        sun.shadows = LightShadows.Soft;

        RenderSettings.ambientMode = AmbientMode.Trilight;
        RenderSettings.ambientSkyColor = new Color(0.58f, 0.68f, 0.78f);
        RenderSettings.ambientEquatorColor = new Color(0.38f, 0.46f, 0.36f);
        RenderSettings.ambientGroundColor = new Color(0.16f, 0.2f, 0.15f);
        RenderSettings.fog = true;
        RenderSettings.fogColor = new Color(0.64f, 0.74f, 0.8f);
        RenderSettings.fogMode = FogMode.ExponentialSquared;
        RenderSettings.fogDensity = 0.0065f;

        Camera camera = Camera.main;
        if (camera != null)
        {
            camera.clearFlags = CameraClearFlags.Skybox;
            camera.backgroundColor = new Color(0.58f, 0.73f, 0.92f);
        }
    }

    private static void DestroyObject(Object objectToDestroy)
    {
        if (objectToDestroy == null)
        {
            return;
        }

        if (Application.isPlaying)
        {
            Object.Destroy(objectToDestroy);
        }
        else
        {
            Object.DestroyImmediate(objectToDestroy);
        }
    }
}
