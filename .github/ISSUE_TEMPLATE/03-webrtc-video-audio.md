---
name: 🔴 Implement WebRTC Video/Audio Communication
about: Critical feature - Add peer-to-peer video and audio streaming
title: '🔴 Implement WebRTC Video/Audio Communication'
labels: enhancement, critical, frontend
assignees: ''
---

## Priority: Critical

### Description
Video and audio communication is not implemented. UI buttons exist but there's no actual WebRTC implementation.

### Current State
- ✅ Video/Audio toggle buttons in EditorPanel
- ✅ CameraHoverPreview shows placeholder UI
- ❌ No WebRTC peer connection
- ❌ No camera/microphone stream capture
- ❌ No video/audio rendering
- ❌ No signaling mechanism

### What Needs to Be Done
1. Implement WebRTC peer connection setup
2. Add media stream capture (getUserMedia)
3. Create signaling mechanism via Socket.IO
4. Implement ICE candidate exchange
5. Add video stream rendering components
6. Handle audio stream playback
7. Configure STUN/TURN servers
8. Add connection state management
9. Implement error handling for permissions

### Technical Approach
- Use **simple-peer** or **PeerJS** for simplified WebRTC
- Implement signaling via existing Socket.IO connection
- Use free STUN servers (Google, Twilio)
- Add TURN server for NAT traversal (optional)
- Create video preview components
- Handle media permissions gracefully

### Recommended Libraries
- `simple-peer` - Simple WebRTC wrapper
- OR `peerjs` - PeerJS library with built-in signaling

### Implementation Steps
1. Install WebRTC library (simple-peer recommended)
2. Request camera/microphone permissions
3. Create local media stream
4. Set up peer connection on room join
5. Implement signaling handlers (offer, answer, ICE)
6. Create video display components
7. Add audio playback
8. Style video previews (picture-in-picture)
9. Add mute/unmute functionality
10. Handle connection errors and reconnection

### UI Components Needed
- Local video preview (small overlay)
- Remote video display (larger view)
- Audio visualizer (optional)
- Connection quality indicator
- Permission request modal

### Acceptance Criteria
- [ ] Camera stream captures and displays locally
- [ ] Microphone captures audio
- [ ] Video streams to remote peer
- [ ] Audio streams to remote peer
- [ ] Mute/unmute works for both video and audio
- [ ] Connection quality is stable
- [ ] Graceful handling of permission denials
- [ ] Reconnection works after network issues
- [ ] Works behind NAT/firewalls

### STUN/TURN Servers
```javascript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];
```

### Estimated Effort
2-3 weeks
