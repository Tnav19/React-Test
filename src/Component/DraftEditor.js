import {
  Editor,
  EditorState,
  Modifier,
  RichUtils,
  convertFromRaw,
  convertToRaw,
  SelectionState,
} from "draft-js";
import "draft-js/dist/Draft.css";
import React, { useEffect, useState } from "react";
import "../App.css";

const DraftEditor = () => {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  useEffect(() => {
    const savedContent = localStorage.getItem("editorContent");
    if (savedContent) {
      const contentState = convertFromRaw(JSON.parse(savedContent));
      if (contentState) {
        setEditorState(EditorState.createWithContent(contentState));
      }
    }
  }, []);

  const onChange = (newEditorState) => {
    let updatedEditorState = newEditorState;
    const contentState = newEditorState.getCurrentContent();
    const selection = newEditorState.getSelection();
    const currentBlock = contentState.getBlockForKey(selection.getStartKey());
    const blockText = currentBlock.getText();

    const specialCharacters = ["# ", "* ", "** ", "*** ", "```` "];
    const foundSpecialCharacter = specialCharacters.find((characters) =>
      blockText.startsWith(characters)
    );
    if (foundSpecialCharacter) {
      updatedEditorState = applyFormatting(
        updatedEditorState,
        foundSpecialCharacter
      );
    }

    setEditorState(updatedEditorState);
  };

  const save = () => {
    const contentStateJSON = convertToRaw(editorState.getCurrentContent());
    localStorage.setItem("editorContent", JSON.stringify(contentStateJSON));
  };

  const applyFormatting = (editorState, characters) => {
    let updatedState = editorState;

    switch (characters) {
      case "# ":
        updatedState = RichUtils.toggleBlockType(updatedState, "header-one");
        updatedState = applyInlineStyleToWholeBlock(updatedState, "header-one");
        break;
      case "* ":
        updatedState = RichUtils.toggleBlockType(updatedState, "unstyled");
        updatedState = applyInlineStyleToWholeBlock(updatedState, "BOLD");
        break;
      case "** ":
        updatedState = RichUtils.toggleBlockType(updatedState, "unstyled");
        updatedState = applyInlineStyleToWholeBlock(updatedState, "RED");
        break;
      case "*** ":
        updatedState = RichUtils.toggleBlockType(updatedState, "unstyled");
        updatedState = applyInlineStyleToWholeBlock(updatedState, "UNDERLINE");
        break;
      case "```` ":
        updatedState = RichUtils.toggleBlockType(updatedState, "code-block");
        updatedState = applyInlineStyleToWholeBlock(updatedState, "CODE");
        break;
      default:
        updatedState = RichUtils.toggleBlockType(updatedState, "unstyled");
        updatedState = removeInlineStyles(updatedState);
        break;
    }
    return updatedState;
  };

  const styleMap = {
    RED: {
      color: "red",
    },
    UNDERLINE: {
      textDecoration: "underline",
    },
    BOLD: {
      fontWeight: "bold",
    },
    CODE: {
      fontFamily: "monospace",
      backgroundColor: "#f0f0f0",
      padding: "3px",
      borderRadius: "3px",
    },
  };

  const removeInlineStyles = (editorState) => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const currentBlockKey = selection.getStartKey();
    const currentBlock = contentState.getBlockForKey(currentBlockKey);

    let newContentState = contentState;

    currentBlock.findStyleRanges(
      (character) => character.hasStyle(),
      (start, end) => {
        const blockSelection = SelectionState.createEmpty(currentBlockKey)
          .merge({
            anchorOffset: start,
            focusOffset: end,
          })
          .collapseToEnd();

        newContentState = Modifier.removeInlineStyle(
          newContentState,
          blockSelection,
          Object.keys(styleMap)
        );
      }
    );

    return EditorState.push(
      editorState,
      newContentState,
      "change-inline-style"
    );
  };

  function applyInlineStyleToWholeBlock(editorState, inlineStyle) {
    const contentState = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const blockKey = selection.getStartKey();
    const block = contentState.getBlockForKey(blockKey);
    const startOffset = 0;
    const endOffset = block.getLength();
    const blockSelection = selection.merge({
      anchorOffset: startOffset,
      focusOffset: endOffset,
    });

    const withoutExistingStyles = Object.keys(styleMap).reduce(
      (state, style) => {
        return Modifier.removeInlineStyle(state, blockSelection, style);
      },
      contentState
    );

    const contentStateWithStyle = Modifier.applyInlineStyle(
      withoutExistingStyles,
      blockSelection,
      inlineStyle
    );

    return EditorState.push(
      editorState,
      contentStateWithStyle,
      "change-inline-style"
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div className="title-container">
          <h3 className="title">Demo editor by Naveen T</h3>
        </div>
        <div>
          <button className="save-button" onClick={save}>
            Save
          </button>
        </div>
      </div>
      <div className="editor-container">
        <Editor
          editorState={editorState}
          onChange={onChange}
          customStyleMap={styleMap}
        />
      </div>
    </div>
  );
};

export default DraftEditor;
