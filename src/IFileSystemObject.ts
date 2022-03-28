interface IFileSystemObject {
  name: string;
  size: number;
  isDirectory: boolean;
  permissions: number; // Convert to octal to see
  created: Date;
  modified: Date;
  hidden: boolean;
}

export default IFileSystemObject;