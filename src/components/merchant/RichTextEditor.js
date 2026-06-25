"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Bold, Italic, Underline, List, ListOrdered, Quote, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Link as LinkIcon, RemoveFormatting, Eye, Code, 
  Image as ImageIcon, Loader2, Sparkles, Maximize2, Minimize2
} from "lucide-react";

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Write your product description here...", 
  label = "Description", 
  onEnhanceAi, 
  enhancingAi 
}) {
  const [isVisualMode, setIsVisualMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync value from prop to visual editor, but ONLY if not focused to avoid resetting cursor
  useEffect(() => {
    if (editorRef.current && isVisualMode) {
      if (editorRef.current.innerHTML !== (value || "")) {
        if (document.activeElement !== editorRef.current) {
          editorRef.current.innerHTML = value || "";
        }
      }
    }
    calculateWordCount(value || "");
  }, [value, isVisualMode]);

  // Track word count
  const calculateWordCount = (htmlText) => {
    // Strip HTML tags
    const cleanText = htmlText.replace(/<\/?[^>]+(>|$)/g, " ").trim();
    if (!cleanText) {
      setWordCount(0);
      return;
    }
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  };

  const handleEditorChange = () => {
    if (editorRef.current && isVisualMode) {
      const html = editorRef.current.innerHTML;
      onChange(html === "<br>" ? "" : html);
      calculateWordCount(html);
    }
  };

  const execCommand = (command, argument = null) => {
    if (!isVisualMode) return;
    
    // Focus first
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    document.execCommand(command, false, argument);
    handleEditorChange();
  };

  const addLink = () => {
    if (!isVisualMode) return;
    const url = prompt("Enter the URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const clearFormatting = () => {
    if (!isVisualMode) return;
    execCommand("removeFormat");
    // Also remove any custom headers/blocks
    execCommand("formatBlock", "div");
  };

  const handleFormatBlock = (e) => {
    const value = e.target.value;
    if (value) {
      execCommand("formatBlock", value);
    }
  };

  // Insert custom HTML at cursor selection
  const insertHTMLAtCursor = (html) => {
    if (!isVisualMode) return;
    
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      
      if (selection.getRangeAt && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const div = document.createElement("div");
        div.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node;
        let lastNode;
        while ((node = div.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        
        range.insertNode(frag);
        
        // Move selection range to after the inserted element
        if (lastNode) {
          const newRange = range.cloneRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        editorRef.current.innerHTML += html;
      }
      handleEditorChange();
    }
  };

  const handleAddMediaClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/merchant/media", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Insert image tag at cursor position
      const imgHtml = `<img src="${data.url}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; display: block;" />`;
      insertHTMLAtCursor(imgHtml);
    } catch (err) {
      console.error("Error uploading editor media:", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingMedia(false);
      // Reset input value to allow uploading same file again
      e.target.value = "";
    }
  };

  return (
    <div className={`flex flex-col border border-zinc-300 rounded-lg bg-white overflow-hidden transition-all ${
      isFullscreen 
        ? "fixed inset-4 z-[9999] shadow-2xl flex flex-col h-[calc(100vh-32px)]" 
        : "w-full"
    }`}>
      {/* Header Controls & Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 flex-wrap gap-2 select-none">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold text-zinc-700">{label}</span>
          
          {/* Add Media Button */}
          {isVisualMode && (
            <button
              type="button"
              onClick={handleAddMediaClick}
              disabled={uploadingMedia}
              className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md text-[11px] font-bold transition-all shadow-sm disabled:opacity-60"
            >
              {uploadingMedia ? (
                <Loader2 size={12} className="animate-spin text-zinc-500" />
              ) : (
                <ImageIcon size={12} className="text-blue-500" />
              )}
              Add Media
            </button>
          )}

          {/* Hidden File Input */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleMediaUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Action Controls & AI */}
        <div className="flex items-center gap-2">
          {/* Enhance with AI */}
          {onEnhanceAi && (
            <button 
              type="button"
              onClick={onEnhanceAi}
              disabled={enhancingAi}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-[11px] font-bold transition-all disabled:opacity-50 shadow-sm"
            >
              {enhancingAi ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Enhance with AI
            </button>
          )}

          {/* Visual/Code Mode Toggle */}
          <div className="flex items-center border border-zinc-200 rounded-md bg-white p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setIsVisualMode(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                isVisualMode 
                  ? "bg-zinc-100 text-zinc-800" 
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Eye size={12} />
              Visual
            </button>
            <button
              type="button"
              onClick={() => {
                // If switching from visual to code, capture visual HTML first
                if (editorRef.current && isVisualMode) {
                  onChange(editorRef.current.innerHTML);
                }
                setIsVisualMode(false);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                !isVisualMode 
                  ? "bg-zinc-100 text-zinc-800" 
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <Code size={12} />
              Code
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-zinc-200 border border-zinc-200 bg-white rounded-md text-zinc-600 shadow-sm transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Formatting Toolbar (Only in Visual Mode) */}
      {isVisualMode && (
        <div className="flex items-center gap-1 p-2 border-b border-zinc-200 bg-zinc-50/50 flex-wrap select-none">
          {/* Format Block Select */}
          <select 
            onChange={handleFormatBlock}
            defaultValue="div"
            className="h-8 px-2 bg-white border border-zinc-200 rounded text-[11px] font-bold outline-none text-zinc-700 ms-2 shadow-sm focus:border-zinc-300"
          >
            <option value="div">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Quote block</option>
          </select>

          {/* Divider */}
          <div className="h-4 w-px bg-zinc-200 mx-1" />

          {/* Formatting Buttons */}
          <button
            type="button"
            onClick={() => execCommand("bold")}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all"
            title="Bold"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand("italic")}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all"
            title="Italic"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand("underline")}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all"
            title="Underline"
          >
            <Underline size={14} />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-zinc-200 mx-1" />

          {/* List Buttons */}
          <button
            type="button"
            onClick={() => execCommand("insertUnorderedList")}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all"
            title="Bullet List"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand("insertOrderedList")}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all"
            title="Numbered List"
          >
            <ListOrdered size={14} />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-zinc-200 mx-1" />

          {/* Alignment Buttons */}
          <button
            type="button"
            onClick={() => execCommand("justifyLeft")}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all"
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyCenter")}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all"
            title="Align Center"
          >
            <AlignCenter size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyRight")}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all"
            title="Align Right"
          >
            <AlignRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyFull")}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all"
            title="Justify"
          >
            <AlignJustify size={14} />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-zinc-200 mx-1" />

          {/* Link Button */}
          <button
            type="button"
            onClick={addLink}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all"
            title="Insert Link"
          >
            <LinkIcon size={14} />
          </button>

          {/* Clear Formatting */}
          <button
            type="button"
            onClick={clearFormatting}
            className="p-1.5 hover:bg-zinc-100 border border-transparent hover:border-zinc-200 rounded text-zinc-700 transition-all me-auto"
            title="Clear Formatting"
          >
            <RemoveFormatting size={14} />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className={`flex-1 relative min-h-[220px] ${isFullscreen ? "h-full" : "h-[300px]"} overflow-auto`}>
        {/* Visual contenteditable Editor */}
        <div
          ref={editorRef}
          contentEditable={isVisualMode}
          onInput={handleEditorChange}
          onBlur={handleEditorChange}
          className={`w-full h-full p-4 focus:outline-none overflow-y-auto text-[14px] text-zinc-800 leading-relaxed font-sans prose prose-sm max-w-none ${
            isVisualMode ? "block" : "hidden"
          }`}
          style={{ minHeight: "220px" }}
          placeholder={placeholder}
        />

        {/* Plain Text Code Editor */}
        <textarea
          value={value || ""}
          onChange={(e) => {
            onChange(e.target.value);
            calculateWordCount(e.target.value);
          }}
          className={`w-full h-full p-4 focus:outline-none border-none outline-none font-mono text-[13px] text-zinc-800 leading-relaxed bg-zinc-900 text-zinc-100 ${
            !isVisualMode ? "block" : "hidden"
          }`}
          style={{ minHeight: "220px", resize: "none" }}
          placeholder="HTML Source Code..."
        />

        {/* Floating placeholder for Visual mode if empty */}
        {isVisualMode && (!value || value === "<br>" || value === "") && (
          <div className="absolute top-4 end-4 text-zinc-400 text-[14px] pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Word Count Footer */}
      <div className="flex justify-between items-center px-4 py-1.5 border-t border-zinc-200 bg-zinc-50 text-[11px] text-zinc-500 font-bold select-none">
        <span>Word count: {wordCount}</span>
        {value && isVisualMode && <span className="italic text-zinc-400">Press Shift+Enter for soft line breaks</span>}
      </div>
    </div>
  );
}
