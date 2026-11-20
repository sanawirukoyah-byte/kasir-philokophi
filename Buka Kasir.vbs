Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = Chr(34) & strPath & "\Buka Kasir.bat" & Chr(34)
WshShell.Run batPath, 0, False
