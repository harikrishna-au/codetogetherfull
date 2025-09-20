import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Video, VideoOff, Mic, MicOff, MessageSquare, LogOut } from 'lucide-react';
import CameraHoverPreview from './CameraHoverPreview';
import RoomTimer from '@/components/RoomTimer';
import { toast } from 'sonner';

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

interface EditorPanelProps {
  code: string;
  setCode: (v: string) => void;
  isSubmitting: boolean;
  handleSubmit: () => void;
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
  code, setCode, isSubmitting, handleSubmit,
  isVideoOn, setIsVideoOn,
  isAudioOn, setIsAudioOn,
  isChatOpen, setIsChatOpen,
  handleExitSession,
  roomId
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');

  // Update code when language changes
  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setSelectedLanguage(newLanguage);
    setCode(languageTemplates[newLanguage]);
    
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

  // Initialize with default template
  useEffect(() => {
    if (!code || code.trim() === '') {
      setCode(languageTemplates[selectedLanguage]);
    }
  }, []);

  // Handle Monaco Editor mount
  const handleEditorDidMount = (editor: any, monaco: any) => {
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
  };

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
          <span className="text-xs text-[#888888] hidden sm:inline">Press Ctrl+Space for suggestions</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSubmit}
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
                <Play className="w-3 h-3 mr-1" />
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
                <CameraHoverPreview isVideoOn={isVideoOn} />
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
          value={code}
          onChange={(value) => setCode(value || '')}
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
