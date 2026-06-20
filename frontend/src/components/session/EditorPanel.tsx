import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Video, VideoOff, Mic, MicOff, MessageSquare, LogOut, CheckCircle } from 'lucide-react';
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

    // ── Register custom site-themed editor (black + landing palette) ─────────
    monaco.editor.defineTheme('codetogether-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '',          foreground: 'cfd3d6' },                       // default — landing text colour
        { token: 'comment',   foreground: '3a3f45', fontStyle: 'italic' },  // very muted
        { token: 'keyword',   foreground: 'c8cdd2', fontStyle: 'bold' },    // bright white-grey
        { token: 'string',    foreground: '8a9099' },                       // mid grey
        { token: 'number',    foreground: 'e2e5e8' },                       // near white
        { token: 'type',      foreground: 'bfc5c9' },
        { token: 'class',     foreground: 'bfc5c9' },
        { token: 'function',  foreground: 'dce0e4' },
        { token: 'variable',  foreground: 'cfd3d6' },
        { token: 'operator',  foreground: '6b7075' },
        { token: 'delimiter', foreground: '4a5057' },
        { token: 'tag',       foreground: 'bfc5c9' },
        { token: 'attribute', foreground: 'a0a8b0' },
        { token: 'constant',  foreground: 'e2e5e8' },
      ],
      colors: {
        'editor.background':              '#08090b',        // arena ink
        'editor.foreground':              '#cfd3d6',
        'editor.lineHighlightBackground': '#4ec9b00a',
        'editor.selectionBackground':     '#4ec9b026',
        'editor.inactiveSelectionBackground': '#4ec9b012',
        'editorLineNumber.foreground':    '#2e3338',
        'editorLineNumber.activeForeground': '#4ec9b0',
        'editorCursor.foreground':        '#6fe9cf',
        'editorWhitespace.foreground':    '#1a1d20',
        'editorIndentGuide.background1':  '#1a1d20',
        'editorIndentGuide.activeBackground1': '#2e3338',
        'editor.findMatchBackground':     '#ffffff20',
        'editor.findMatchHighlightBackground': '#ffffff10',
        'editorSuggestWidget.background': '#0a0a0a',
        'editorSuggestWidget.border':     '#ffffff0d',
        'editorSuggestWidget.selectedBackground': '#ffffff0a',
        'editorSuggestWidget.foreground': '#cfd3d6',
        'editorSuggestWidget.highlightForeground': '#ffffff',
        'scrollbarSlider.background':     '#ffffff08',
        'scrollbarSlider.hoverBackground':'#ffffff12',
        'scrollbarSlider.activeBackground':'#ffffff18',
        'editorGutter.background':        '#08090b',
        'minimap.background':             '#08090b',
      },
    });
    monaco.editor.setTheme('codetogether-dark');

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
    <div className="h-full bg-[#08090b] flex flex-col">
      <div className="h-11 border-b border-white/[0.08] flex items-center justify-between px-4"
           style={{ background: 'linear-gradient(180deg, #0e1114, #0a0c0e)' }}>
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1.5 text-xs font-mono-ct font-semibold text-[#6fe9cf]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ec9b0]" /> editor
          </span>
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-[#cfd3d6] focus:outline-none focus:border-[#4ec9b0]/40 cursor-pointer"
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
            className="bg-white/[0.04] hover:bg-white/[0.08] text-[#9aa1a9] hover:text-[#e8ebee] text-xs h-7 px-3 border border-white/[0.08] hover:border-[#4ec9b0]/30"
          >
            <Play className="w-3 h-3 mr-1" />
            Run
          </Button>

          {/* Submit Button (All Tests) — arena teal */}
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="text-xs h-7 px-4 font-semibold border-0 text-[#04201b] transition-all hover:brightness-110 disabled:opacity-60"
            style={{ background: 'linear-gradient(100deg,#6fe9cf,#4ec9b0)', boxShadow: '0 4px 16px -4px rgba(78,201,176,0.5)' }}
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
          {/* Video toggle */}
          <button
            onClick={() => setIsVideoOn((v) => !v)}
            className={`p-2 rounded border transition-colors duration-150 focus:outline-none ${isVideoOn ? 'bg-[#4ec9b0]/15 border-[#4ec9b0]/40 text-[#6fe9cf]' : 'bg-transparent border-white/[0.08] text-[#3a3f45] hover:border-white/[0.15] hover:text-[#8a9099]'}`}
            title={isVideoOn ? 'Turn off video' : 'Turn on video'}
          >
            {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsAudioOn((a) => !a)}
            className={`p-2 rounded border transition-colors duration-150 focus:outline-none ${isAudioOn ? 'bg-[#4ec9b0]/15 border-[#4ec9b0]/40 text-[#6fe9cf]' : 'bg-transparent border-white/[0.08] text-[#3a3f45] hover:border-white/[0.15] hover:text-[#8a9099]'}`}
            title={isAudioOn ? 'Mute mic' : 'Unmute mic'}
          >
            {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsChatOpen((c) => !c)}
            className={`p-2 rounded border transition-colors duration-150 focus:outline-none ${isChatOpen ? 'bg-[#4ec9b0]/15 border-[#4ec9b0]/40 text-[#6fe9cf]' : 'bg-transparent border-white/[0.08] text-[#3a3f45] hover:border-white/[0.15] hover:text-[#8a9099]'}`}
            title={isChatOpen ? 'Hide chat' : 'Show chat'}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          {roomId && <RoomTimer roomId={roomId} className="ml-2" />}
          <button
            onClick={handleExitSession}
            className="p-2 rounded border border-white/[0.08] bg-transparent text-[#4a5057] hover:border-red-900/60 hover:text-red-400 hover:bg-red-950/30 transition-colors duration-150 focus:outline-none ml-1"
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
          theme="codetogether-dark"
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
