using System.Collections.Generic;
using UnityEngine;

public class EndlessFlatGround : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private int radiusInChunks = 3;
    [SerializeField] private int forwardExtraChunks = 2;
    [SerializeField] private float chunkSize = 96f;
    [SerializeField] private float groundThickness = 1f;
    [SerializeField] private float physicsGroundSize = 100000f;
    [SerializeField] private float roadWidth = 9f;
    [SerializeField] private Vector3 parkingLotCenter = new Vector3(0f, 0f, -8f);
    [SerializeField] private Vector2 parkingLotSize = new Vector2(24f, 18f);
    [SerializeField] private float parkingLotClearance = 18f;
    [SerializeField] private int treesPerChunk = 28;
    [SerializeField] private int housesPerChunk = 7;
    [SerializeField] private int detailClumpsPerChunk = 18;
    [SerializeField] private float trafficCarChance = 0.72f;
    [SerializeField] private float lakeChance = 0.018f;
    [SerializeField] private float shopChance = 0.08f;
    [SerializeField] private float specialBuildingChance = 0.045f;
    [SerializeField] private Color groundColor = new Color(0.19f, 0.35f, 0.2f);
    [SerializeField] private Color roadColor = new Color(0.11f, 0.12f, 0.12f);

    private readonly Dictionary<Vector2Int, GameObject> chunks = new Dictionary<Vector2Int, GameObject>();
    private Material groundMaterial;
    private Material roadMaterial;
    private Material roadLineMaterial;
    private Material parkingLotMaterial;
    private Material treeTrunkMaterial;
    private Material treeLeafMaterial;
    private Material shrubMaterial;
    private Material flowerMaterial;
    private Material rockMaterial;
    private Material streetLightMaterial;
    private Material streetLightGlowMaterial;
    private Material waterMaterial;
    private Material shopMaterial;
    private Material shopTrimMaterial;
    private Material windowMaterial;
    private Material signMaterial;
    private Material specialBuildingMaterial;
    private Material metalMaterial;
    private Material[] houseMaterials;
    private Material[] trafficMaterials;
    private Material roofMaterial;
    private Vector2Int lastCenterChunk;
    private bool hasCenterChunk;
    private int worldSeed;

    public void SetTarget(Transform newTarget)
    {
        target = newTarget;
        UpdateChunks(true);
    }

    private void Awake()
    {
        ClearGeneratedGroundChildren();
        worldSeed = Random.Range(int.MinValue, int.MaxValue);
        groundMaterial = CreateMaterial("Endless Ground", groundColor);
        roadMaterial = CreateMaterial("Endless Road", roadColor);
        roadLineMaterial = CreateMaterial("Road Lines", new Color(0.86f, 0.8f, 0.42f));
        parkingLotMaterial = CreateMaterial("Parking Lot", new Color(0.16f, 0.16f, 0.15f));
        treeTrunkMaterial = CreateMaterial("Tree Trunk", new Color(0.34f, 0.19f, 0.09f));
        treeLeafMaterial = CreateMaterial("Tree Leaves", new Color(0.08f, 0.36f, 0.13f));
        shrubMaterial = CreateMaterial("Shrub", new Color(0.09f, 0.43f, 0.16f));
        flowerMaterial = CreateMaterial("Wild Flowers", new Color(0.92f, 0.74f, 0.22f));
        rockMaterial = CreateMaterial("Small Rocks", new Color(0.36f, 0.36f, 0.33f));
        streetLightMaterial = CreateMaterial("Street Light Pole", new Color(0.28f, 0.29f, 0.27f));
        streetLightGlowMaterial = CreateMaterial("Street Light Glow", new Color(1f, 0.82f, 0.42f));
        waterMaterial = CreateMaterial("Lake Water", new Color(0.07f, 0.34f, 0.62f));
        shopMaterial = CreateMaterial("Shop Wall", new Color(0.72f, 0.24f, 0.22f));
        shopTrimMaterial = CreateMaterial("Shop Trim", new Color(0.95f, 0.82f, 0.28f));
        windowMaterial = CreateMaterial("Dark Windows", new Color(0.08f, 0.16f, 0.2f));
        signMaterial = CreateMaterial("Bright Sign", new Color(0.95f, 0.24f, 0.12f));
        specialBuildingMaterial = CreateMaterial("Special Building", new Color(0.42f, 0.42f, 0.48f));
        metalMaterial = CreateMaterial("Industrial Metal", new Color(0.55f, 0.57f, 0.55f));
        roofMaterial = CreateMaterial("House Roof", new Color(0.36f, 0.07f, 0.05f));
        houseMaterials = new[]
        {
            CreateMaterial("House White", new Color(0.82f, 0.8f, 0.72f)),
            CreateMaterial("House Brick", new Color(0.58f, 0.26f, 0.2f)),
            CreateMaterial("House Blue", new Color(0.34f, 0.48f, 0.62f)),
            CreateMaterial("House Yellow", new Color(0.78f, 0.65f, 0.34f))
        };
        trafficMaterials = new[]
        {
            CreateMaterial("Traffic Car Green", new Color(0.1f, 0.45f, 0.24f)),
            CreateMaterial("Traffic Car Yellow", new Color(0.94f, 0.74f, 0.18f)),
            CreateMaterial("Traffic Car White", new Color(0.82f, 0.84f, 0.8f)),
            CreateMaterial("Traffic Car Purple", new Color(0.38f, 0.24f, 0.55f))
        };
        CreatePhysicsGround();
    }

    private void Update()
    {
        UpdateChunks(false);
    }

    private void UpdateChunks(bool force)
    {
        if (target == null || groundMaterial == null)
        {
            return;
        }

        Vector2Int center = WorldToChunk(target.position);
        if (!force && hasCenterChunk && center == lastCenterChunk)
        {
            return;
        }

        lastCenterChunk = center;
        hasCenterChunk = true;

        HashSet<Vector2Int> needed = new HashSet<Vector2Int>();

        Vector2Int forward = GetForwardChunkDirection();

        for (int x = -radiusInChunks; x <= radiusInChunks; x++)
        {
            for (int z = -radiusInChunks; z <= radiusInChunks; z++)
            {
                Vector2Int coordinate = new Vector2Int(center.x + x, center.y + z);
                needed.Add(coordinate);

                if (!chunks.ContainsKey(coordinate))
                {
                    chunks.Add(coordinate, CreateChunk(coordinate));
                }
            }
        }

        for (int i = 1; i <= forwardExtraChunks; i++)
        {
            Vector2Int forwardCenter = center + forward * (radiusInChunks + i);
            for (int side = -radiusInChunks; side <= radiusInChunks; side++)
            {
                Vector2Int coordinate = forward.x != 0
                    ? new Vector2Int(forwardCenter.x, forwardCenter.y + side)
                    : new Vector2Int(forwardCenter.x + side, forwardCenter.y);
                needed.Add(coordinate);

                if (!chunks.ContainsKey(coordinate))
                {
                    chunks.Add(coordinate, CreateChunk(coordinate));
                }
            }
        }

        List<Vector2Int> stale = new List<Vector2Int>();
        foreach (Vector2Int coordinate in chunks.Keys)
        {
            if (!needed.Contains(coordinate))
            {
                stale.Add(coordinate);
            }
        }

        foreach (Vector2Int coordinate in stale)
        {
            DestroyGeneratedObject(chunks[coordinate]);
            chunks.Remove(coordinate);
        }
    }

    private Vector2Int WorldToChunk(Vector3 position)
    {
        return new Vector2Int(
            Mathf.FloorToInt(position.x / chunkSize),
            Mathf.FloorToInt(position.z / chunkSize));
    }

    private int GetChunkSeed(Vector2Int coordinate)
    {
        unchecked
        {
            int hash = worldSeed;
            hash = (hash * 397) ^ coordinate.x;
            hash = (hash * 397) ^ coordinate.y;
            return hash;
        }
    }

    private static float RandomRange(System.Random random, float min, float max)
    {
        return min + (float)random.NextDouble() * (max - min);
    }

    private GameObject CreateChunk(Vector2Int coordinate)
    {
        GameObject chunk = new GameObject("Ground Chunk " + coordinate.x + "," + coordinate.y);
        chunk.transform.SetParent(transform, false);
        chunk.transform.position = new Vector3(
            (coordinate.x + 0.5f) * chunkSize,
            -groundThickness * 0.5f,
            (coordinate.y + 0.5f) * chunkSize);

        GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
        ground.name = "Ground";
        ground.transform.SetParent(chunk.transform, false);
        ground.transform.localPosition = Vector3.zero;
        ground.transform.localScale = new Vector3(chunkSize, groundThickness, chunkSize);
        ground.GetComponent<Renderer>().material = groundMaterial;
        DestroyGeneratedObject(ground.GetComponent<Collider>());

        CreateRoad(chunk.transform, new Vector3(0f, groundThickness * 0.5f + 0.03f, 0f), new Vector3(chunkSize, 0.08f, 6f));
        CreateRoad(chunk.transform, new Vector3(0f, groundThickness * 0.5f + 0.04f, 0f), new Vector3(6f, 0.08f, chunkSize));
        CreateRoadDetails(chunk.transform);
        CreateParkingLotIfNeeded(chunk.transform, coordinate);
        PopulateChunk(chunk.transform, coordinate);

        return chunk;
    }

    private Vector2Int GetForwardChunkDirection()
    {
        if (target == null)
        {
            return Vector2Int.up;
        }

        Vector3 forward = target.forward;
        return Mathf.Abs(forward.x) > Mathf.Abs(forward.z)
            ? new Vector2Int(forward.x >= 0f ? 1 : -1, 0)
            : new Vector2Int(0, forward.z >= 0f ? 1 : -1);
    }

    private void PopulateChunk(Transform chunk, Vector2Int coordinate)
    {
        System.Random random = new System.Random(GetChunkSeed(coordinate));
        List<LakeArea> lakes = new List<LakeArea>();
        List<BuildArea> blockedAreas = new List<BuildArea>();
        int localHouses = housesPerChunk + random.Next(-2, 3);
        int localTrees = treesPerChunk + random.Next(-8, 9);
        int localDetails = detailClumpsPerChunk + random.Next(-5, 6);

        if (random.NextDouble() < lakeChance && TryCreateLake(chunk, random, out LakeArea lake))
        {
            lakes.Add(lake);
        }

        if (random.NextDouble() < shopChance)
        {
            Vector3 scale = new Vector3(RandomRange(random, 13f, 18f), RandomRange(random, 4.2f, 6.5f), RandomRange(random, 10f, 15f));
            float footprintClearance = Mathf.Max(scale.x, scale.z) * 0.75f + 12f;
            Vector3 position = GetBuildableLocalPosition(chunk, random, footprintClearance, lakes, blockedAreas);
            CreateShop(chunk, position, scale, random);
            blockedAreas.Add(new BuildArea(position, Mathf.Max(scale.x, scale.z) * 0.7f + 6f));
        }

        if (random.NextDouble() < specialBuildingChance)
        {
            Vector3 position = GetBuildableLocalPosition(chunk, random, 22f, lakes, blockedAreas);
            CreateSpecialBuilding(chunk, position, random);
            blockedAreas.Add(new BuildArea(position, 18f));
        }

        for (int i = 0; i < localHouses; i++)
        {
            Vector3 scale = new Vector3(
                RandomRange(random, 5f, 11f),
                RandomRange(random, 4f, 11f),
                RandomRange(random, 5f, 12f));
            float footprintClearance = Mathf.Max(scale.x, scale.z) * 0.65f + 10f;
            Vector3 position = GetBuildableLocalPosition(chunk, random, footprintClearance, lakes, blockedAreas);
            CreateHouse(chunk, position, scale, random);
            blockedAreas.Add(new BuildArea(position, Mathf.Max(scale.x, scale.z) * 0.65f + 4f));
        }

        for (int i = 0; i < localTrees; i++)
        {
            Vector3 position = GetBuildableLocalPosition(chunk, random, 6f, lakes, blockedAreas);
            CreateTree(chunk, position, random);
            blockedAreas.Add(new BuildArea(position, 3.5f));
        }

        for (int i = 0; i < localDetails; i++)
        {
            Vector3 position = GetBuildableLocalPosition(chunk, random, 4f, lakes, blockedAreas);
            CreateGroundDetail(chunk, position, random);
        }

        TryCreateTrafficCars(chunk, random);
    }

    private bool TryCreateLake(Transform parent, System.Random random, out LakeArea lakeArea)
    {
        float width = RandomRange(random, 18f, 42f);
        float length = RandomRange(random, 14f, 36f);
        float edgeMargin = Mathf.Max(width, length) * 0.7f;

        if (!TryGetLakeLocalPosition(parent, random, edgeMargin, out Vector3 position))
        {
            lakeArea = default;
            return false;
        }

        GameObject lake = new GameObject("Lake");
        lake.name = "Lake";
        lake.transform.SetParent(parent, false);
        lake.transform.localPosition = position + Vector3.up * 0.08f;
        lake.transform.localRotation = Quaternion.Euler(0f, RandomRange(random, 0f, 360f), 0f);

        MeshFilter meshFilter = lake.AddComponent<MeshFilter>();
        meshFilter.mesh = CreateIrregularLakeMesh(random, width, length);

        MeshRenderer meshRenderer = lake.AddComponent<MeshRenderer>();
        meshRenderer.material = waterMaterial;

        BoxCollider lakeCollider = lake.AddComponent<BoxCollider>();
        lakeCollider.center = new Vector3(0f, 0.25f, 0f);
        lakeCollider.size = new Vector3(width * 0.92f, 1.2f, length * 0.92f);
        lakeCollider.isTrigger = true;
        lake.gameObject.AddComponent<LakeHazard>();

        lakeArea = new LakeArea(position, width * 0.68f, length * 0.68f);
        return true;
    }

    private Mesh CreateIrregularLakeMesh(System.Random random, float width, float length)
    {
        int points = random.Next(10, 17);
        Vector3[] vertices = new Vector3[points + 1];
        int[] triangles = new int[points * 3];
        vertices[0] = Vector3.zero;

        for (int i = 0; i < points; i++)
        {
            float angle = i / (float)points * Mathf.PI * 2f;
            float wobble = RandomRange(random, 0.68f, 1.18f);
            float secondaryWobble = 1f + Mathf.Sin(angle * random.Next(2, 5)) * RandomRange(random, 0.04f, 0.16f);
            vertices[i + 1] = new Vector3(
                Mathf.Cos(angle) * width * 0.5f * wobble,
                0f,
                Mathf.Sin(angle) * length * 0.5f * wobble * secondaryWobble);

            triangles[i * 3] = 0;
            triangles[i * 3 + 1] = i + 1;
            triangles[i * 3 + 2] = i == points - 1 ? 1 : i + 2;
        }

        Mesh mesh = new Mesh();
        mesh.name = "Irregular Lake Mesh";
        mesh.vertices = vertices;
        mesh.triangles = triangles;
        mesh.RecalculateBounds();
        mesh.RecalculateNormals();
        return mesh;
    }

    private bool TryGetLakeLocalPosition(Transform chunk, System.Random random, float edgeMargin, out Vector3 position)
    {
        for (int i = 0; i < 32; i++)
        {
            float x = RandomRange(random, -chunkSize * 0.5f + edgeMargin, chunkSize * 0.5f - edgeMargin);
            float z = RandomRange(random, -chunkSize * 0.5f + edgeMargin, chunkSize * 0.5f - edgeMargin);
            position = new Vector3(x, groundThickness * 0.5f, z);

            if (Mathf.Abs(x) > roadWidth * 0.5f + 20f
                && Mathf.Abs(z) > roadWidth * 0.5f + 20f
                && !IsInsideParkingLot(chunk.TransformPoint(position), 24f))
            {
                return true;
            }
        }

        position = Vector3.zero;
        return false;
    }

    private void CreateRoadDetails(Transform parent)
    {
        for (int i = -5; i <= 5; i++)
        {
            float offset = i * 8f;
            CreateRoadLine(parent, new Vector3(offset, groundThickness * 0.5f + 0.11f, 0f), new Vector3(3.2f, 0.04f, 0.18f));
            CreateRoadLine(parent, new Vector3(0f, groundThickness * 0.5f + 0.12f, offset), new Vector3(0.18f, 0.04f, 3.2f));
        }

        CreateStreetLight(parent, new Vector3(-roadWidth * 0.5f - 2.2f, groundThickness * 0.5f, -chunkSize * 0.26f));
        CreateStreetLight(parent, new Vector3(roadWidth * 0.5f + 2.2f, groundThickness * 0.5f, chunkSize * 0.26f));
        CreateStreetLight(parent, new Vector3(-chunkSize * 0.26f, groundThickness * 0.5f, roadWidth * 0.5f + 2.2f));
        CreateStreetLight(parent, new Vector3(chunkSize * 0.26f, groundThickness * 0.5f, -roadWidth * 0.5f - 2.2f));
    }

    private void CreateRoadLine(Transform parent, Vector3 localPosition, Vector3 localScale)
    {
        GameObject line = GameObject.CreatePrimitive(PrimitiveType.Cube);
        line.name = "Road Line";
        line.transform.SetParent(parent, false);
        line.transform.localPosition = localPosition;
        line.transform.localScale = localScale;
        line.GetComponent<Renderer>().material = roadLineMaterial;
        DestroyGeneratedObject(line.GetComponent<Collider>());
    }

    private void CreateStreetLight(Transform parent, Vector3 localPosition)
    {
        GameObject pole = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        pole.name = "Street Light";
        pole.transform.SetParent(parent, false);
        pole.transform.localPosition = localPosition + Vector3.up * 2.2f;
        pole.transform.localScale = new Vector3(0.16f, 2.2f, 0.16f);
        pole.GetComponent<Renderer>().material = streetLightMaterial;
        DestroyGeneratedObject(pole.GetComponent<Collider>());

        GameObject lamp = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        lamp.name = "Lamp Glow";
        lamp.transform.SetParent(pole.transform, false);
        lamp.transform.localPosition = new Vector3(0f, 1.06f, 0f);
        lamp.transform.localScale = new Vector3(2.1f, 0.36f, 2.1f);
        lamp.GetComponent<Renderer>().material = streetLightGlowMaterial;
        DestroyGeneratedObject(lamp.GetComponent<Collider>());

        Light light = lamp.AddComponent<Light>();
        light.type = LightType.Point;
        light.color = new Color(1f, 0.78f, 0.42f);
        light.intensity = 0.65f;
        light.range = 18f;
    }

    private void CreateParkingLotIfNeeded(Transform parent, Vector2Int coordinate)
    {
        Vector2Int parkingChunk = WorldToChunk(parkingLotCenter);
        if (coordinate != parkingChunk)
        {
            return;
        }

        GameObject parkingLot = GameObject.CreatePrimitive(PrimitiveType.Cube);
        parkingLot.name = "Starting Parking Lot";
        parkingLot.transform.SetParent(parent, false);
        parkingLot.transform.position = new Vector3(parkingLotCenter.x, groundThickness * 0.5f + 0.07f, parkingLotCenter.z);
        parkingLot.transform.localScale = new Vector3(parkingLotSize.x, 0.09f, parkingLotSize.y);
        parkingLot.GetComponent<Renderer>().material = parkingLotMaterial;
        DestroyGeneratedObject(parkingLot.GetComponent<Collider>());

        Vector3 localParkingCenter = parent.InverseTransformPoint(parkingLotCenter);
        for (int i = -1; i <= 1; i++)
        {
            CreateParkingLine(parent, localParkingCenter + new Vector3(i * 4f, groundThickness * 0.5f + 0.14f, 0f), new Vector3(0.16f, 0.06f, parkingLotSize.y * 0.72f));
        }
    }

    private void CreateParkingLine(Transform parent, Vector3 localPosition, Vector3 localScale)
    {
        GameObject line = GameObject.CreatePrimitive(PrimitiveType.Cube);
        line.name = "Parking Line";
        line.transform.SetParent(parent, false);
        line.transform.localPosition = localPosition;
        line.transform.localScale = localScale;
        line.GetComponent<Renderer>().material = CreateMaterial("Parking Line", new Color(0.9f, 0.86f, 0.58f));
        DestroyGeneratedObject(line.GetComponent<Collider>());
    }

    private Vector3 GetBuildableLocalPosition(Transform chunk, System.Random random, float roadClearance, List<LakeArea> lakes, List<BuildArea> blockedAreas)
    {
        for (int i = 0; i < 80; i++)
        {
            float x = RandomRange(random, -chunkSize * 0.45f, chunkSize * 0.45f);
            float z = RandomRange(random, -chunkSize * 0.45f, chunkSize * 0.45f);
            Vector3 position = new Vector3(x, groundThickness * 0.5f, z);

            if (!IsLocalPositionOnRoad(position, roadWidth + roadClearance * 2f)
                && !IsInsideParkingLot(chunk.TransformPoint(position), roadClearance)
                && !IsInsideAnyLake(position, lakes, roadClearance)
                && !IsInsideAnyBuildArea(position, blockedAreas, roadClearance * 0.35f))
            {
                return position;
            }
        }

        return GetSafeFallbackLocalPosition(chunk, roadClearance, lakes, blockedAreas);
    }

    private Vector3 GetSafeFallbackLocalPosition(Transform chunk, float roadClearance, List<LakeArea> lakes, List<BuildArea> blockedAreas)
    {
        Vector3[] candidates =
        {
            new Vector3(chunkSize * 0.36f, groundThickness * 0.5f, chunkSize * 0.36f),
            new Vector3(-chunkSize * 0.36f, groundThickness * 0.5f, chunkSize * 0.36f),
            new Vector3(chunkSize * 0.36f, groundThickness * 0.5f, -chunkSize * 0.36f),
            new Vector3(-chunkSize * 0.36f, groundThickness * 0.5f, -chunkSize * 0.36f)
        };

        foreach (Vector3 candidate in candidates)
        {
            if (!IsLocalPositionOnRoad(candidate, roadWidth + roadClearance * 2f)
                && !IsInsideParkingLot(chunk.TransformPoint(candidate), roadClearance)
                && !IsInsideAnyLake(candidate, lakes, roadClearance)
                && !IsInsideAnyBuildArea(candidate, blockedAreas, roadClearance * 0.35f))
            {
                return candidate;
            }
        }

        return candidates[0];
    }

    private bool IsLocalPositionOnRoad(Vector3 localPosition, float paddedRoadWidth)
    {
        float halfWidth = paddedRoadWidth * 0.5f;
        return Mathf.Abs(localPosition.x) <= halfWidth || Mathf.Abs(localPosition.z) <= halfWidth;
    }

    public static bool IsWorldPositionOnRoad(Vector3 worldPosition, float paddedRoadWidth = 9f, float chunkSize = 96f)
    {
        Vector3 local = GetRoadLocalOffset(worldPosition, chunkSize);
        float halfWidth = paddedRoadWidth * 0.5f;
        return Mathf.Abs(local.x) <= halfWidth || Mathf.Abs(local.z) <= halfWidth;
    }

    public static Vector3 GetRoadLocalOffset(Vector3 worldPosition, float chunkSize = 96f)
    {
        float localX = Mathf.Repeat(worldPosition.x, chunkSize) - chunkSize * 0.5f;
        float localZ = Mathf.Repeat(worldPosition.z, chunkSize) - chunkSize * 0.5f;
        return new Vector3(localX, 0f, localZ);
    }

    private bool IsInsideParkingLot(Vector3 worldPosition, float padding)
    {
        float halfWidth = parkingLotSize.x * 0.5f + parkingLotClearance + padding;
        float halfLength = parkingLotSize.y * 0.5f + parkingLotClearance + padding;
        return Mathf.Abs(worldPosition.x - parkingLotCenter.x) <= halfWidth
            && Mathf.Abs(worldPosition.z - parkingLotCenter.z) <= halfLength;
    }

    private static bool IsInsideAnyLake(Vector3 position, List<LakeArea> lakes, float padding)
    {
        if (lakes == null)
        {
            return false;
        }

        foreach (LakeArea lake in lakes)
        {
            float normalizedX = (position.x - lake.Center.x) / (lake.RadiusX + padding);
            float normalizedZ = (position.z - lake.Center.z) / (lake.RadiusZ + padding);
            if (normalizedX * normalizedX + normalizedZ * normalizedZ <= 1f)
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsInsideAnyBuildArea(Vector3 position, List<BuildArea> buildAreas, float padding)
    {
        if (buildAreas == null)
        {
            return false;
        }

        foreach (BuildArea area in buildAreas)
        {
            Vector2 delta = new Vector2(position.x - area.Center.x, position.z - area.Center.z);
            if (delta.magnitude <= area.Radius + padding)
            {
                return true;
            }
        }

        return false;
    }

    private void CreateHouse(Transform parent, Vector3 localPosition, Vector3 scale, System.Random random)
    {
        GameObject house = GameObject.CreatePrimitive(PrimitiveType.Cube);
        house.name = "House";
        house.transform.SetParent(parent, false);
        house.transform.localPosition = localPosition + Vector3.up * (scale.y * 0.5f);
        house.transform.localRotation = Quaternion.Euler(0f, random.Next(0, 4) * 90f, 0f);
        house.transform.localScale = scale;
        house.GetComponent<Renderer>().material = houseMaterials[random.Next(0, houseMaterials.Length)];

        GameObject roof = GameObject.CreatePrimitive(PrimitiveType.Cube);
        roof.name = "Roof";
        roof.transform.SetParent(house.transform, false);
        roof.transform.localPosition = new Vector3(0f, 0.58f, 0f);
        roof.transform.localScale = new Vector3(1.12f, 0.18f, 1.12f);
        roof.GetComponent<Renderer>().material = roofMaterial;
        DestroyGeneratedObject(roof.GetComponent<Collider>());
    }

    private void CreateShop(Transform parent, Vector3 localPosition, Vector3 scale, System.Random random)
    {
        GameObject shop = GameObject.CreatePrimitive(PrimitiveType.Cube);
        shop.name = random.NextDouble() < 0.45 ? "Rare Shop" : "Gas Stop";
        shop.transform.SetParent(parent, false);
        shop.transform.localPosition = localPosition + Vector3.up * (scale.y * 0.5f);
        shop.transform.localRotation = Quaternion.Euler(0f, random.Next(0, 4) * 90f, 0f);
        shop.transform.localScale = scale;
        shop.GetComponent<Renderer>().material = shopMaterial;

        GameObject awning = GameObject.CreatePrimitive(PrimitiveType.Cube);
        awning.name = "Shop Awning";
        awning.transform.SetParent(shop.transform, false);
        awning.transform.localPosition = new Vector3(0f, 0.16f, -0.56f);
        awning.transform.localScale = new Vector3(1.08f, 0.12f, 0.18f);
        awning.GetComponent<Renderer>().material = shopTrimMaterial;
        DestroyGeneratedObject(awning.GetComponent<Collider>());

        GameObject sign = GameObject.CreatePrimitive(PrimitiveType.Cube);
        sign.name = "Shop Sign";
        sign.transform.SetParent(shop.transform, false);
        sign.transform.localPosition = new Vector3(0f, 0.12f, -0.61f);
        sign.transform.localScale = new Vector3(0.72f, 0.16f, 0.035f);
        sign.GetComponent<Renderer>().material = signMaterial;
        DestroyGeneratedObject(sign.GetComponent<Collider>());

        CreateWallWindow(shop.transform, new Vector3(-0.27f, -0.05f, -0.515f), new Vector3(0.22f, 0.22f, 0.03f));
        CreateWallWindow(shop.transform, new Vector3(0.27f, -0.05f, -0.515f), new Vector3(0.22f, 0.22f, 0.03f));

        if (shop.name == "Gas Stop")
        {
            CreateGasPump(parent, localPosition + shop.transform.forward * -10f + shop.transform.right * 4f);
            CreateGasPump(parent, localPosition + shop.transform.forward * -10f + shop.transform.right * -4f);
        }
    }

    private void CreateSpecialBuilding(Transform parent, Vector3 localPosition, System.Random random)
    {
        int type = random.Next(0, 3);
        if (type == 0)
        {
            CreateWarehouse(parent, localPosition, random);
        }
        else if (type == 1)
        {
            CreateRadioTower(parent, localPosition);
        }
        else
        {
            CreateWaterTower(parent, localPosition);
        }
    }

    private void CreateWarehouse(Transform parent, Vector3 localPosition, System.Random random)
    {
        Vector3 scale = new Vector3(RandomRange(random, 18f, 24f), RandomRange(random, 6f, 9f), RandomRange(random, 14f, 22f));
        GameObject warehouse = GameObject.CreatePrimitive(PrimitiveType.Cube);
        warehouse.name = "Special Warehouse";
        warehouse.transform.SetParent(parent, false);
        warehouse.transform.localPosition = localPosition + Vector3.up * (scale.y * 0.5f);
        warehouse.transform.localRotation = Quaternion.Euler(0f, random.Next(0, 4) * 90f, 0f);
        warehouse.transform.localScale = scale;
        warehouse.GetComponent<Renderer>().material = specialBuildingMaterial;

        GameObject door = GameObject.CreatePrimitive(PrimitiveType.Cube);
        door.name = "Warehouse Door";
        door.transform.SetParent(warehouse.transform, false);
        door.transform.localPosition = new Vector3(0f, -0.18f, -0.505f);
        door.transform.localScale = new Vector3(0.36f, 0.52f, 0.03f);
        door.GetComponent<Renderer>().material = metalMaterial;
        DestroyGeneratedObject(door.GetComponent<Collider>());
    }

    private void CreateRadioTower(Transform parent, Vector3 localPosition)
    {
        GameObject root = new GameObject("Special Radio Tower");
        root.transform.SetParent(parent, false);
        root.transform.localPosition = localPosition;

        GameObject pole = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        pole.name = "Tower Pole";
        pole.transform.SetParent(root.transform, false);
        pole.transform.localPosition = Vector3.up * 7f;
        pole.transform.localScale = new Vector3(0.35f, 7f, 0.35f);
        pole.GetComponent<Renderer>().material = metalMaterial;

        GameObject beacon = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        beacon.name = "Tower Beacon";
        beacon.transform.SetParent(root.transform, false);
        beacon.transform.localPosition = Vector3.up * 14.3f;
        beacon.transform.localScale = new Vector3(1.2f, 1.2f, 1.2f);
        beacon.GetComponent<Renderer>().material = signMaterial;
        DestroyGeneratedObject(beacon.GetComponent<Collider>());
    }

    private void CreateWaterTower(Transform parent, Vector3 localPosition)
    {
        GameObject root = new GameObject("Special Water Tower");
        root.transform.SetParent(parent, false);
        root.transform.localPosition = localPosition;

        GameObject legs = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        legs.name = "Water Tower Stand";
        legs.transform.SetParent(root.transform, false);
        legs.transform.localPosition = Vector3.up * 3.6f;
        legs.transform.localScale = new Vector3(0.55f, 3.6f, 0.55f);
        legs.GetComponent<Renderer>().material = metalMaterial;

        GameObject tank = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        tank.name = "Water Tank";
        tank.transform.SetParent(root.transform, false);
        tank.transform.localPosition = Vector3.up * 7.9f;
        tank.transform.localScale = new Vector3(5.2f, 2.8f, 5.2f);
        tank.GetComponent<Renderer>().material = specialBuildingMaterial;
        DestroyGeneratedObject(tank.GetComponent<Collider>());
    }

    private void CreateWallWindow(Transform parent, Vector3 localPosition, Vector3 localScale)
    {
        GameObject window = GameObject.CreatePrimitive(PrimitiveType.Cube);
        window.name = "Window";
        window.transform.SetParent(parent, false);
        window.transform.localPosition = localPosition;
        window.transform.localScale = localScale;
        window.GetComponent<Renderer>().material = windowMaterial;
        DestroyGeneratedObject(window.GetComponent<Collider>());
    }

    private void CreateGasPump(Transform parent, Vector3 localPosition)
    {
        if (IsLocalPositionOnRoad(localPosition, roadWidth + 2.5f) || IsInsideParkingLot(parent.TransformPoint(localPosition), 4f))
        {
            return;
        }

        GameObject pump = GameObject.CreatePrimitive(PrimitiveType.Cube);
        pump.name = "Gas Pump";
        pump.transform.SetParent(parent, false);
        pump.transform.localPosition = localPosition + Vector3.up * 0.8f;
        pump.transform.localScale = new Vector3(0.7f, 1.6f, 0.55f);
        pump.GetComponent<Renderer>().material = signMaterial;
    }

    private void CreateTree(Transform parent, Vector3 localPosition, System.Random random)
    {
        float height = RandomRange(random, 4f, 7f);

        GameObject trunk = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        trunk.name = "Tree";
        trunk.transform.SetParent(parent, false);
        trunk.transform.localPosition = localPosition + Vector3.up * (height * 0.38f);
        trunk.transform.localScale = new Vector3(0.55f, height * 0.38f, 0.55f);
        trunk.GetComponent<Renderer>().material = treeTrunkMaterial;

        CapsuleCollider treeCollider = trunk.GetComponent<CapsuleCollider>();
        if (treeCollider != null)
        {
            treeCollider.radius = 0.75f;
        }

        GameObject leaves = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        leaves.name = "Leaves";
        leaves.transform.SetParent(trunk.transform, false);
        leaves.transform.localPosition = new Vector3(0f, 1.25f, 0f);
        float leafSize = RandomRange(random, 2.6f, 4.2f);
        leaves.transform.localScale = new Vector3(leafSize, leafSize * 0.85f, leafSize);
        leaves.GetComponent<Renderer>().material = treeLeafMaterial;
        DestroyGeneratedObject(leaves.GetComponent<Collider>());
    }

    private void CreateGroundDetail(Transform parent, Vector3 localPosition, System.Random random)
    {
        double roll = random.NextDouble();
        if (roll < 0.5)
        {
            CreateShrub(parent, localPosition, random);
        }
        else if (roll < 0.78)
        {
            CreateRock(parent, localPosition, random);
        }
        else
        {
            CreateFlowerPatch(parent, localPosition, random);
        }
    }

    private void CreateShrub(Transform parent, Vector3 localPosition, System.Random random)
    {
        GameObject shrub = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        shrub.name = "Shrub";
        shrub.transform.SetParent(parent, false);
        shrub.transform.localPosition = localPosition + Vector3.up * 0.38f;
        float size = RandomRange(random, 0.9f, 1.9f);
        shrub.transform.localScale = new Vector3(size, size * 0.55f, size);
        shrub.GetComponent<Renderer>().material = shrubMaterial;
        DestroyGeneratedObject(shrub.GetComponent<Collider>());
    }

    private void CreateRock(Transform parent, Vector3 localPosition, System.Random random)
    {
        GameObject rock = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        rock.name = "Rock";
        rock.transform.SetParent(parent, false);
        rock.transform.localPosition = localPosition + Vector3.up * 0.22f;
        rock.transform.localRotation = Quaternion.Euler(RandomRange(random, -12f, 12f), RandomRange(random, 0f, 360f), RandomRange(random, -12f, 12f));
        float size = RandomRange(random, 0.55f, 1.25f);
        rock.transform.localScale = new Vector3(size * RandomRange(random, 1f, 1.7f), size * 0.45f, size);
        rock.GetComponent<Renderer>().material = rockMaterial;
        DestroyGeneratedObject(rock.GetComponent<Collider>());
    }

    private void CreateFlowerPatch(Transform parent, Vector3 localPosition, System.Random random)
    {
        int flowers = random.Next(3, 7);
        for (int i = 0; i < flowers; i++)
        {
            GameObject flower = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            flower.name = "Flower";
            flower.transform.SetParent(parent, false);
            flower.transform.localPosition = localPosition + new Vector3(RandomRange(random, -1.2f, 1.2f), 0.08f, RandomRange(random, -1.2f, 1.2f));
            flower.transform.localScale = new Vector3(0.22f, 0.12f, 0.22f);
            flower.GetComponent<Renderer>().material = flowerMaterial;
            DestroyGeneratedObject(flower.GetComponent<Collider>());
        }
    }

    private void TryCreateTrafficCars(Transform parent, System.Random random)
    {
        if (random.NextDouble() > trafficCarChance)
        {
            return;
        }

        int cars = random.Next(1, 3);
        for (int i = 0; i < cars; i++)
        {
            bool horizontal = random.NextDouble() < 0.5;
            float laneOffset = (random.NextDouble() < 0.5 ? -1f : 1f) * 1.65f;
            float travelOffset = RandomRange(random, -chunkSize * 0.42f, chunkSize * 0.42f);
            Vector3 localPosition = horizontal
                ? new Vector3(travelOffset, groundThickness * 0.5f + 0.18f, laneOffset)
                : new Vector3(laneOffset, groundThickness * 0.5f + 0.18f, travelOffset);
            Vector3 direction = horizontal ? Vector3.right : Vector3.forward;
            if (laneOffset > 0f)
            {
                direction = -direction;
            }

            CreateTrafficCar(parent, localPosition, direction, random);
        }
    }

    private void CreateTrafficCar(Transform parent, Vector3 localPosition, Vector3 direction, System.Random random)
    {
        GameObject car = new GameObject("Traffic Car");
        car.transform.SetParent(parent, false);
        car.transform.localPosition = localPosition;
        car.transform.localRotation = Quaternion.LookRotation(direction, Vector3.up);

        Rigidbody rb = car.AddComponent<Rigidbody>();
        rb.mass = 820f;

        BoxCollider collider = car.AddComponent<BoxCollider>();
        collider.center = new Vector3(0f, 0.32f, 0f);
        collider.size = new Vector3(1.65f, 0.75f, 3.15f);
        car.AddComponent<VehicleCollisionPushback>();

        GameObject body = GameObject.CreatePrimitive(PrimitiveType.Cube);
        body.name = "Body";
        body.transform.SetParent(car.transform, false);
        body.transform.localPosition = new Vector3(0f, 0.36f, 0f);
        body.transform.localScale = new Vector3(1.65f, 0.48f, 3.05f);
        body.GetComponent<Renderer>().material = trafficMaterials[random.Next(0, trafficMaterials.Length)];
        DestroyGeneratedObject(body.GetComponent<Collider>());

        GameObject cabin = GameObject.CreatePrimitive(PrimitiveType.Cube);
        cabin.name = "Cabin";
        cabin.transform.SetParent(car.transform, false);
        cabin.transform.localPosition = new Vector3(0f, 0.76f, -0.18f);
        cabin.transform.localScale = new Vector3(1.15f, 0.42f, 1.2f);
        cabin.GetComponent<Renderer>().material = CreateMaterial("Traffic Cabin", new Color(0.08f, 0.11f, 0.13f));
        DestroyGeneratedObject(cabin.GetComponent<Collider>());

        TrafficCarAI.TrafficPersonality personality = GetTrafficPersonality(random);
        if (personality == TrafficCarAI.TrafficPersonality.Grandma)
        {
            car.name = "Grandma Traffic Car";
            body.transform.localScale = new Vector3(1.55f, 0.5f, 2.85f);
            cabin.transform.localScale = new Vector3(1.08f, 0.44f, 1.08f);
        }
        else if (personality == TrafficCarAI.TrafficPersonality.Drunk)
        {
            car.name = "Erratic Traffic Car";
            body.transform.localRotation = Quaternion.Euler(0f, RandomRange(random, -2.5f, 2.5f), 0f);
        }

        TrafficCarAI trafficAI = car.AddComponent<TrafficCarAI>();
        trafficAI.Configure(direction, RandomRange(random, 6.3f, 11.2f), roadWidth, chunkSize, target, personality);
    }

    private static TrafficCarAI.TrafficPersonality GetTrafficPersonality(System.Random random)
    {
        double roll = random.NextDouble();
        if (roll < 0.25)
        {
            return TrafficCarAI.TrafficPersonality.Grandma;
        }

        if (roll < 0.43)
        {
            return TrafficCarAI.TrafficPersonality.Drunk;
        }

        return TrafficCarAI.TrafficPersonality.Normal;
    }

    private void CreatePhysicsGround()
    {
        GameObject physicsGround = GameObject.CreatePrimitive(PrimitiveType.Cube);
        physicsGround.name = "Smooth Physics Ground";
        physicsGround.transform.SetParent(transform, false);
        physicsGround.transform.position = new Vector3(0f, -groundThickness * 0.5f, 0f);
        physicsGround.transform.localScale = new Vector3(physicsGroundSize, groundThickness, physicsGroundSize);

        Renderer renderer = physicsGround.GetComponent<Renderer>();
        if (renderer != null)
        {
            renderer.enabled = false;
        }
    }

    private void ClearGeneratedGroundChildren()
    {
        Transform[] children = new Transform[transform.childCount];
        for (int i = 0; i < transform.childCount; i++)
        {
            children[i] = transform.GetChild(i);
        }

        foreach (Transform child in children)
        {
            if (child == null)
            {
                continue;
            }

            if (child.name.StartsWith("Ground Chunk") || child.name == "Smooth Physics Ground")
            {
                DestroyGeneratedObject(child.gameObject);
            }
        }
    }

    private static void DestroyGeneratedObject(Object objectToDestroy)
    {
        if (Application.isPlaying)
        {
            Destroy(objectToDestroy);
        }
        else
        {
            DestroyImmediate(objectToDestroy);
        }
    }

    private void CreateRoad(Transform parent, Vector3 localPosition, Vector3 localScale)
    {
        GameObject road = GameObject.CreatePrimitive(PrimitiveType.Cube);
        road.name = "Road";
        road.transform.SetParent(parent, false);
        road.transform.localPosition = localPosition;
        road.transform.localScale = localScale;
        road.GetComponent<Renderer>().material = roadMaterial;
        DestroyGeneratedObject(road.GetComponent<Collider>());
    }

    private static Material CreateMaterial(string name, Color color)
    {
        Shader shader = Shader.Find("Standard");
        if (shader == null)
        {
            shader = Shader.Find("Universal Render Pipeline/Lit");
        }

        Material material = new Material(shader);
        material.name = name;
        material.color = color;
        return material;
    }

    private readonly struct LakeArea
    {
        public readonly Vector3 Center;
        public readonly float RadiusX;
        public readonly float RadiusZ;

        public LakeArea(Vector3 center, float radiusX, float radiusZ)
        {
            Center = center;
            RadiusX = radiusX;
            RadiusZ = radiusZ;
        }
    }

    private readonly struct BuildArea
    {
        public readonly Vector3 Center;
        public readonly float Radius;

        public BuildArea(Vector3 center, float radius)
        {
            Center = center;
            Radius = radius;
        }
    }
}
