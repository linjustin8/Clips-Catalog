export interface Clip {
  _id: string;
  title: string;
  uploader: string;
  uploaderUsername?: string | null;
  categories: string[];
  s3Key?: string;
  contentType?: string;
  fileSize?: number;
  uploadDate: string;
  playbackUrl: string;
}
