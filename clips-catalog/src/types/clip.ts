export interface Clip {
  _id: string;
  title: string;
  uploader: string;
  categories: string[];
  s3Key?: string;
  contentType?: string;
  fileSize?: number;
  uploadDate: string;
  playbackUrl: string;
}
