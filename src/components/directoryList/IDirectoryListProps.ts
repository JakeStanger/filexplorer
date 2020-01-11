import IFileSystemObject from "../../IFileSystemObject";

interface IDirectoryListProps {
  relPath: string;
  contents: IFileSystemObject[];
}

export default IDirectoryListProps;