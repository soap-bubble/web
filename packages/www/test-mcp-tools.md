# MCP Tools Test Results

Testing Morpheus MCP server tools through Cursor's MCP interface.

## Test Environment
- Browser URL: `http://localhost:3000/scene/1050?mcp=test`
- Session Name: `test`
- WebSocket: `ws://localhost:3000/api/game-control?client=browser&session=test`
- Browser Status: ✅ Connected (green "WS: test" indicator visible)

## Test Execution Results

### 1. morpheus_connection_status ✅
**Result**: Initial state shows `isConnected: false` (as expected before connecting)

---

### 2. morpheus_connect_session ✅
**Result**: Successfully connected to session "test"
- WebSocket connection established
- Session ID received: "test"
- Connection confirmed

---

### 3. morpheus_get_scene_info ✅
**Result**: Successfully retrieved scene information
- Scene ID: 1050
- Scene Type: 1
- Hotspots: 8
- Connected Scenes: 6 (105001, 105101, 105049, 105050, 105051, 105053)

---

### 4. morpheus_list_scenes ✅
**Result**: Successfully listed all scenes
- Total scenes: 1844
- First 10: 100000, 1010, 1020, 1030, 1040, 1050, 1110, 1120, 1130, 1150

---

### 5. morpheus_get_current_state ✅
**Result**: Successfully retrieved live game state
- Current Scene ID: 1050
- Rotation: x=0, y=0, offsetX=0
- Hotspots: 8 visible
- First hotspot: castId=0, actionType=ChangeScene

---

### 6. morpheus_rotate_to ✅
**Result**: Rotation command sent successfully
- Command sent: x=1800, y=0
- Note: State may take a moment to update after rotation

---

### 7. morpheus_load_scene ✅
**Result**: Scene load command sent successfully
- Command sent to load scene 100000
- Browser should navigate to new scene

---

### 8. morpheus_click_hotspot
**Expected Result**: Browser-validated hotspot click result
- Selects a hotspot by `targetSceneId`, `hotspotIndex`, or unique `castId`
- Sends `CLICK_HOTSPOT` to the connected browser
- Browser validates the expected source scene and exact hotspot selector
- Reports the browser-observed outcome, including current scene and relevant state changes
- Does not send `LOAD_SCENE` as a shortcut for navigation hotspots

---

## Summary

✅ **Core MCP connection, scene query, state, rotation, and load tools tested.**

`morpheus_click_hotspot` should be tested with a connected browser session after starting the custom dev server. Success is the browser-reported click result, not command-send success.

### Test Coverage:
- ✅ Connection management (status, connect)
- ✅ Scene information queries (get info, list scenes)
- ✅ Live state retrieval
- ✅ Game control (rotate, load scene)
- 🔁 Browser-validated hotspot click result (requires named browser session)

### Notes:
- Tools that require WebSocket connection: `morpheus_get_current_state`, `morpheus_rotate_to`, `morpheus_load_scene`
- Tools that work without connection: `morpheus_get_scene_info`, `morpheus_list_scenes`
- Session name must match between browser URL (`?mcp=test`) and MCP connection (`sessionName: "test"`)
- The MCP server successfully communicates with the browser through the WebSocket broker

## Testing Through Cursor's MCP Interface

To test the tools through Cursor's MCP interface:

1. **Ensure MCP server is configured** in `.cursor/mcp.json`:
   ```json
   {
     "mcpServers": {
       "morpheus-game": {
         "command": "yarn",
         "args": ["workspace", "morpheus-next", "mcp"]
       }
     }
   }
   ```

2. **Start the dev server**: `yarn workspace morpheus-next dev`

3. **Open browser with session**: `http://localhost:3000/scene/1050?mcp=test`

4. **Use the tools in Cursor** - The MCP tools should be available when you reference them in conversation, or you can explicitly ask to:
   - Connect to session "test"
   - Get scene info for scene 1050
   - List all scenes
   - Get current game state
   - Rotate the panorama
   - Load a different scene
   - Click a hotspot by target scene or hotspot index
