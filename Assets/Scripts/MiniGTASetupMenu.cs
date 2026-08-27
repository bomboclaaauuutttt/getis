#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

public static class MiniGTASetupMenu
{
    [MenuItem("Mini GTA/Build Drivable Car Prototype")]
    public static void BuildPrototype()
    {
        MiniGTABootstrap.CreatePrototypeSceneInEditor();
        EditorSceneManager.MarkSceneDirty(UnityEngine.SceneManagement.SceneManager.GetActiveScene());
        Debug.Log("Mini GTA prototype created. Press Play and drive with WASD or arrow keys.");
    }
}
#endif
