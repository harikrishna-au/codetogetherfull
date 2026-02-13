import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Video, VideoOff, Mic, MicOff, MessageSquare, LogOut, CheckCircle } from 'lucide-react';
import CameraHoverPreview from './CameraHoverPreview';
import RoomTimer from '@/components/RoomTimer';
import { toast } from 'sonner';
import type { PartnerUser } from '@/hooks/useYjsCollaboration';

// ---- Inject y-monaco cursor CSS once ----
// y-monaco creates .yRemoteSelectionHead-{clientId} and .yRemoteSelection-{clientId}
// classes dynamically. We add a global stylesheet that makes the name label always
// visible (not just on hover) and polishes it for the VS Dark theme.

let yjsCssInjected = false;
function injectYjsCss() {
  if (yjsCssInjected || typeof document === 'undefined') return;
  yjsCssInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    /* Cursor caret — thin vertical line */
    .yRemoteSelectionHead {
      position: absolute;
      border-left: 2px solid;
      border-top: 2px solid;
      border-bottom: 2px solid;
      height: 100%;
      box-sizing: border-box;
    }
    /* Always-visible name label */
    .yRemoteSelectionHead::after {
      content: attr(data-user-name);
      position: absolute;
      top: -1.35em;
      left: -2px;
      padding: 1px 5px;
      border-radius: 3px 3px 3px 0;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
      /* Color set inline via style attribute by y-monaco */
      background: inherit;
      color: #fff;
      line-height: 1.4;
      z-index: 10;
    }
    /* Selection highlight — semi-transparent tinted background */
    .yRemoteSelection {
      opacity: 0.25;
    }
  `;
  document.head.appendChild(style);
}

// Language-specific boilerplate templates
const languageTemplates = {
  javascript: `function solution() {
  // Write your JavaScript code here
  
}`,
  python: `def solution():
    # Write your Python code here
    pass`,
  java: `public class Solution {
    public void solution() {
        // Write your Java code here
        
    }
}`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    void solution() {
        // Write your C++ code here
        
    }
};`
};

// Language mapping for Monaco Editor
const monacoLanguageMap = {
  javascript: 'javascript',
  python: 'python',
  java: 'java',
  cpp: 'cpp'
};

type SupportedLanguage = keyof typeof languageTemplates;

// Simplified language-specific suggestions
const languageSuggestions = {
  javascript: [
    {
      label: 'for loop',
      insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3:// code}\n}',
      documentation: 'For loop with index'
    },
    {
      label: 'while loop',
      insertText: 'while (${1:condition}) {\n\t${2:// code}\n}',
      documentation: 'While loop'
    },
    {
      label: 'if statement',
      insertText: 'if (${1:condition}) {\n\t${2:// code}\n}',
      documentation: 'If statement'
    },
    {
      label: 'function',
      insertText: 'function ${1:name}(${2:params}) {\n\t${3:// code}\n\treturn ${4:result};\n}',
      documentation: 'Function declaration'
    }
  ],
  python: [
    {
      label: 'for loop',
      insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:# code}',
      documentation: 'For loop in Python'
    },
    {
      label: 'while loop',
      insertText: 'while ${1:condition}:\n    ${2:# code}',
      documentation: 'While loop in Python'
    },
    {
      label: 'if statement',
      insertText: 'if ${1:condition}:\n    ${2:# code}',
      documentation: 'If statement in Python'
    },
    {
      label: 'def function',
      insertText: 'def ${1:function_name}(${2:params}):\n    ${3:# code}\n    return ${4:result}',
      documentation: 'Function definition'
    }
  ],
  java: [
    {
      label: 'for loop',
      insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n    ${3:// code}\n}',
      documentation: 'For loop in Java'
    },
    {
      label: 'while loop',
      insertText: 'while (${1:condition}) {\n    ${2:// code}\n}',
      documentation: 'While loop in Java'
    },
    {
      label: 'if statement',
      insertText: 'if (${1:condition}) {\n    ${2:// code}\n}',
      documentation: 'If statement in Java'
    },
    {
      label: 'method',
      insertText: 'public ${1:returnType} ${2:methodName}(${3:params}) {\n    ${4:// code}\n    return ${5:result};\n}',
      documentation: 'Method declaration'
    }
  ],
  cpp: [
    {
      label: 'for loop',
      insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3:// code}\n}',
      documentation: 'For loop in C++'
    },
    {
      label: 'while loop',
      insertText: 'while (${1:condition}) {\n    ${2:// code}\n}',
      documentation: 'While loop in C++'
    },
    {
      label: 'if statement',
      insertText: 'if (${1:condition}) {\n    ${2:// code}\n}',
      documentation: 'If statement in C++'
    },
    {
      label: 'function',
      insertText: '${1:returnType} ${2:functionName}(${3:params}) {\n    ${4:// code}\n    return ${5:result};\n}',
      documentation: 'Function declaration'
    }
  ]
};

export { languageTemplates };
export type { SupportedLanguage };

interface EditorPanelProps {
  code: string;
  setCode: (v: string) => void;
  isSubmitting: boolean;
  onRun: () => void;
  onSubmit: () => void;
  /** Called when the local user changes language */
  onLanguageChange?: (lang: SupportedLanguage) => void;
  /** Controlled language from parent (for partner sync) */
  language?: SupportedLanguage;
  /** Called after Monaco mounts — used to attach Yjs binding */
  onEditorMount?: (editor: any, monaco: any) => void;
  /** Explicitly unbind Yjs when sync is disabled */
  unbind?: () => void;
  /** Remote users from Yjs awareness (for avatar badges) */
  partnerUsers?: PartnerUser[];
  /** True while the partner moved their cursor in the last 1.5 s */
  partnerTyping?: boolean;
  isVideoOn: boolean;
  setIsVideoOn: (v: (prev: boolean) => boolean) => void;
  isAudioOn: boolean;
  setIsAudioOn: (v: (prev: boolean) => boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (v: (prev: boolean) => boolean) => void;
  handleExitSession: () => void;
  roomId: string;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  isWebRTCConnected?: boolean;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  code, setCode, isSubmitting, onRun, onSubmit, onLanguageChange,
  language: controlledLanguage, onEditorMount, unbind,
  partnerUsers = [], partnerTyping = false,
  isVideoOn, setIsVideoOn,
  isAudioOn, setIsAudioOn,
  isChatOpen, setIsChatOpen,
  handleExitSession,
  roomId,
  localStream = null,
  remoteStream = null,
  isWebRTCConnected = false,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  // Inject y-monaco cursor CSS once when the editor is first used
  const cssInjectedRef = useRef(false);
  if (!cssInjectedRef.current) {
    injectYjsCss();
    cssInjectedRef.current = true;
  }

  // Sync controlled language prop (partner changed language)
  useEffect(() => {
    if (controlledLanguage && controlledLanguage !== selectedLanguage) {
      setSelectedLanguage(controlledLanguage);
    }
  }, [controlledLanguage]);

  // Update code when language changes (template reset is handled by Yjs in parent)
  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setSelectedLanguage(newLanguage);
    if (!onEditorMount) {
      // Fallback: update code directly when not in Yjs mode
      setCode(languageTemplates[newLanguage]);
    }
    onLanguageChange?.(newLanguage);

    // Show helpful toast with language-specific info
    const languageInfo = {
      javascript: 'JavaScript selected. Use Ctrl+Space for snippets like "for", "while", "if", "function"',
      python: 'Python selected. Use Ctrl+Space for snippets like "for", "while", "if", "def"',
      java: 'Java selected. Use Ctrl+Space for snippets like "for", "while", "if", "method"',
      cpp: 'C++ selected. Use Ctrl+Space for snippets like "for", "while", "if", "function"'
    };

    toast.success(languageInfo[newLanguage], {
      duration: 3000,
    });
  };

  // Initialize with default template (only when not controlled by Yjs)
  useEffect(() => {
    if (!onEditorMount && (!code || code.trim() === '')) {
      setCode(languageTemplates[selectedLanguage]);
    }
  }, []);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Handle Monaco Editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register completion providers for each language
    Object.keys(languageSuggestions).forEach((lang) => {
      monaco.languages.registerCompletionItemProvider(monacoLanguageMap[lang as SupportedLanguage], {
        provideCompletionItems: (model: any, position: any) => {
          const suggestions = languageSuggestions[lang as SupportedLanguage].map((suggestion: any) => ({
            ...suggestion,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column,
            },
          }));

          return { suggestions };
        }
      });
    });

    // Enable better IntelliSense for TypeScript/JavaScript
    if (monaco.languages.typescript) {
      monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
      monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    }

    // Attach Yjs binding (or any external mount handler)
    onEditorMount?.(editor, monaco);
  };

  // Re-bind or unbind when onEditorMount/unbind props change (e.g. Sync toggle)
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      if (onEditorMount) {
        // Re-bind Yjs
        onEditorMount(editorRef.current, monacoRef.current);
      } else if (unbind) {
        // Unbind Yjs and sync local state with current editor content
        unbind();
        const currentVal = editorRef.current.getValue();
        setCode(currentVal);
      }
    }
  }, [onEditorMount, unbind, setCode]);

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      <div className="h-10 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-[#cccccc]">Code</span>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-[#3c3c3c] border border-[#3e3e42] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          {/* Partner presence: avatar badges + typing indicator */}
          {partnerUsers.length > 0 && (
            <div className="flex items-center gap-1.5">
              {partnerUsers.map((u) => (
                <div
                  key={u.clientId}
                  title={u.name}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: u.color + '28', color: u.color, border: `1px solid ${u.color}50` }}
                >
                  {/* Colored dot */}
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: u.color }}
                  />
                  <span className="max-w-[80px] truncate">{u.name}</span>
                </div>
              ))}
              {partnerTyping && (
                <span className="text-xs text-[#888888] italic animate-pulse">
                  typing…
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Run Button (Visible Tests) */}
          <Button
            onClick={onRun}
            disabled={isSubmitting}
            variant="secondary"
            className="bg-[#3e3e42] hover:bg-[#4e4e52] text-white text-xs h-7 px-3 border border-[#525255]"
          >
            <Play className="w-3 h-3 mr-1" />
            Run
          </Button>

          {/* Submit Button (All Tests) */}
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Submit
              </>
            )}
          </Button>
          {/* Session Controls beside submit */}
          <div className="relative group">
            <button
              onClick={() => setIsVideoOn((v) => !v)}
              className={`p-2 rounded transition-colors duration-150 focus:outline-none ${isVideoOn ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              title={isVideoOn ? 'Turn off video' : 'Turn on video'}
            >
              {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
            {/* Hover Preview Popover */}
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-40 hidden group-hover:block">
              <div className="bg-white text-black rounded shadow-lg p-2 min-w-[220px]">
                <CameraHoverPreview
                  isVideoOn={isVideoOn}
                  isAudioOn={isAudioOn}
                  localStream={localStream}
                  remoteStream={remoteStream}
                  isConnected={isWebRTCConnected}
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsAudioOn((a) => !a)}
            className={`p-2 rounded transition-colors duration-150 focus:outline-none ${isAudioOn ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            title={isAudioOn ? 'Mute mic' : 'Unmute mic'}
          >
            {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsChatOpen((c) => !c)}
            className={`p-2 rounded transition-colors duration-150 focus:outline-none ${isChatOpen ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            title={isChatOpen ? 'Hide chat' : 'Show chat'}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          {roomId && <RoomTimer roomId={roomId} className="ml-2" />}
          <button
            onClick={handleExitSession}
            className="p-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors duration-150 focus:outline-none ml-1"
            title="Exit session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language={monacoLanguageMap[selectedLanguage]}
          // When Yjs is active, Monaco is uncontrolled — Yjs owns the content.
          // Using defaultValue avoids @monaco-editor/react's controlled value
          // fighting the CRDT on every remote update.
          {...(onEditorMount
            ? { defaultValue: languageTemplates[selectedLanguage] }
            : { value: code, onChange: (v) => setCode(v || '') }
          )}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3,
            wordWrap: 'on',
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false
            },
            parameterHints: {
              enabled: true
            },
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            accessibilitySupport: 'off',
            tabCompletion: 'on',
            wordBasedSuggestions: 'matchingDocuments',
            // Enhanced IntelliSense
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
              showConstructors: true,
              showDeprecated: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showTypeParameters: true,
            }
          }}
        />
      </div>
    </div>
  );
};

export default EditorPanel;
