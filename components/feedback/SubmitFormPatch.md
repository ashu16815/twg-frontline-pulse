## How to embed VoiceCapture in your submit feedback form

```tsx
import VoiceCapture from '@/components/feedback/VoiceCapture';

// inside your form near the "What actions are you taking?" textarea
const [actions, setActions] = useState('');

<VoiceCapture onText={(t) => setActions(prev => (prev ? (prev + ' ' + t) : t))} />
<textarea 
  className='textarea input' 
  value={actions} 
  onChange={e => setActions(e.target.value)} 
  placeholder='What actions are you taking? (you can speak using the mic)' 
/>
```

- Default uses **Web Speech API** (no extra keys). Set `AZURE_SPEECH_ENABLED=true` later to swap to Azure Speech (integration stub to be added if required).
