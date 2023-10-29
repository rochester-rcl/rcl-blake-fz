import React from "react";

function getFileData(fileList) {
    let fileData = { images: {}, xml: null }
    for (let file of fileList) {
        if (file.type.includes("image")) {
            let url = URL.createObjectURL(file);
            fileData.images[file.name] = url;
        }

        if (file.type.includes("xml")) {
            let url = URL.createObjectURL(file);
            fileData.xml = { [file.name]: url }
        }
    }
    return fileData;
}

export function LocalFileLoader(props) {
    let { onLoadFiles, trigger } = props;
    let inputRef = React.useRef();

    let onClickTrigger = React.useCallback(() => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    }, []);

    let onSelectFiles = React.useCallback(() => {
        if (inputRef.current) {
            let { files } = inputRef.current;
            let fileData = getFileData(files);
            onLoadFiles(fileData);
        }
    }, []);

    return (
        <div>
            <div onClick={onClickTrigger}>{trigger}</div>
            <input
                style={{ display: "none" }}
                ref={inputRef}
                type="file"
                multiple={true}
                onChange={onSelectFiles}
            />
        </div>
    );
}
