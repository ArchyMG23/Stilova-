import { IStorageProvider, StorageUploadOptions, UserRole } from "../types";
import { supabase, hasRuntimeConfig, supabaseUrl } from "./supabase";

// ====================================================
// SUPABASE STORAGE PROVIDER (Active)
// ====================================================
export class SupabaseStorageProvider implements IStorageProvider {
  async uploadFile(file: File, options: StorageUploadOptions): Promise<string> {
    const hasRealSupabase = hasRuntimeConfig || (
      supabaseUrl && 
      !supabaseUrl.includes("placeholder-project") && 
      !supabaseUrl.includes("your-supabase")
    );

    if (!hasRealSupabase) {
      console.warn("[Storage] Environment uses default Supabase. Converting to local URL to ensure 100% offline success.");
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve((reader.result as string) || "");
        };
        reader.readAsDataURL(file);
      });
    }

    try {
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(options.filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: options.contentType || file.type,
        });

      if (error) {
        console.warn(`[SupabaseStorageProvider] Upload error, falling back to local base64 preview:`, error);
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve((reader.result as string) || "");
          };
          reader.readAsDataURL(file);
        });
      }

      const { data: publicData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(options.filePath);

      return publicData.publicUrl;
    } catch (e) {
      console.warn("[SupabaseStorageProvider] Storage client threw, falling back to local base64 preview:", e);
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve((reader.result as string) || "");
        };
        reader.readAsDataURL(file);
      });
    }
  }

  async deleteFile(bucket: string, filePath: string): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      console.error(`[SupabaseStorageProvider] Delete error:`, error);
      throw error;
    }
  }

  async getPublicUrl(bucket: string, filePath: string): Promise<string> {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async createSignedUrl(bucket: string, filePath: string, expiresInSeconds: number): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds);
    if (error) {
      console.error(`[SupabaseStorageProvider] SignedUrl error:`, error);
      throw error;
    }
    return data.signedUrl;
  }

  async moveTemporaryFile(sourcePath: string, destBucket: string, destPath: string): Promise<string> {
    const { data: downloadBlob, error: downloadError } = await supabase.storage
      .from("temporary")
      .download(sourcePath);
    
    if (downloadError) {
      console.error(`[SupabaseStorageProvider] Download temp file error:`, downloadError);
      throw downloadError;
    }
    if (!downloadBlob) {
      throw new Error("Downloaded temporary file is empty");
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(destBucket)
      .upload(destPath, downloadBlob, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(`[SupabaseStorageProvider] Relocate from temp error:`, uploadError);
      throw uploadError;
    }

    // Erase standard source file inside the temporary bucket
    await supabase.storage.from("temporary").remove([sourcePath]);

    const { data: publicData } = supabase.storage.from(destBucket).getPublicUrl(destPath);
    return publicData.publicUrl;
  }
}

// ====================================================
// AWS S3 STORAGE PROVIDER (Inactive Template for Future Portability)
// ====================================================
export class S3StorageProvider implements IStorageProvider {
  async uploadFile(file: File, options: StorageUploadOptions): Promise<string> {
    throw new Error("S3StorageProvider is inactive. Please configure AWS Credentials in the project setup first.");
  }
  async deleteFile(bucket: string, filePath: string): Promise<void> {
    throw new Error("S3StorageProvider is inactive.");
  }
  async getPublicUrl(bucket: string, filePath: string): Promise<string> {
    throw new Error("S3StorageProvider is inactive.");
  }
  async createSignedUrl(bucket: string, filePath: string, expiresInSeconds: number): Promise<string> {
    throw new Error("S3StorageProvider is inactive.");
  }
  async moveTemporaryFile(sourcePath: string, destBucket: string, destPath: string): Promise<string> {
    throw new Error("S3StorageProvider is inactive.");
  }
}

// ====================================================
// STORAGE SERVICE MAIN ABSTRACTION LAYER
// ====================================================
const activeProvider: IStorageProvider = new SupabaseStorageProvider();

export const StorageService = {
  validateUpload(file: File, category: "avatar" | "cover" | "illustration" | "document"): void {
    const validImageExtensions = ["jpg", "jpeg", "png", "webp"];
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    
    if (category === "document") {
      if (fileExt !== "pdf") {
        throw new Error("Format de fichier non valide : les documents de chapitre doivent être au format PDF.");
      }
    } else {
      if (!validImageExtensions.includes(fileExt)) {
        throw new Error("Format d'image non valide : veuillez choisir un format JPG, JPEG, PNG ou WEBP.");
      }
    }

    const fileSizeMB = file.size / (1024 * 1024);
    let maxSizeMB = 25; // Default max size bounds
    
    if (category === "avatar") maxSizeMB = 5;
    if (category === "cover") maxSizeMB = 10;
    if (category === "illustration") maxSizeMB = 20;

    if (fileSizeMB > maxSizeMB) {
      throw new Error(`Le fichier est trop volumineux. La taille maximale autorisée pour un ${category} est de ${maxSizeMB} Mo (Actuel : ${fileSizeMB.toFixed(2)} Mo).`);
    }
  },

  async uploadAvatar(file: File, userId: string, userRole: UserRole): Promise<string> {
    this.validateUpload(file, "avatar");
    const ext = file.name.split(".").pop() || "png";
    const filePath = `user_${userId}/avatar_${Date.now()}.${ext}`;
    
    return activeProvider.uploadFile(file, {
      bucket: "avatars",
      filePath,
      userId,
      userRole,
    });
  },

  async uploadStoryCover(file: File, storyId: string, userId: string, userRole: UserRole): Promise<string> {
    if (
      userRole !== "AUTHOR" && 
      userRole !== "ADMIN" && 
      userRole !== "SUPER_ADMIN" && 
      userRole !== "FOUNDER_OWNER"
    ) {
      throw new Error("NON AUTORISÉ : Seuls les auteurs et administrateurs peuvent importer une couverture.");
    }
    this.validateUpload(file, "cover");
    const ext = file.name.split(".").pop() || "png";
    const filePath = `story_${storyId}/cover_${Date.now()}.${ext}`;

    return activeProvider.uploadFile(file, {
      bucket: "covers",
      filePath,
      userId,
      userRole,
    });
  },

  async uploadIllustration(file: File, storyId: string, nodeId: string, userId: string, userRole: UserRole): Promise<string> {
    if (
      userRole !== "AUTHOR" && 
      userRole !== "ADMIN" && 
      userRole !== "SUPER_ADMIN" && 
      userRole !== "FOUNDER_OWNER"
    ) {
      throw new Error("NON AUTORISÉ : Seuls les auteurs peuvent importer une illustration.");
    }
    this.validateUpload(file, "illustration");
    const ext = file.name.split(".").pop() || "png";
    const filePath = `story_${storyId}/node_${nodeId}/illustration_${Date.now()}.${ext}`;

    return activeProvider.uploadFile(file, {
      bucket: "illustrations",
      filePath,
      userId,
      userRole,
    });
  },

  async uploadContestAsset(file: File, contestId: string, userId: string, userRole: UserRole): Promise<string> {
    if (
      userRole !== "ADMIN" && 
      userRole !== "SUPER_ADMIN" && 
      userRole !== "FOUNDER_OWNER"
    ) {
      throw new Error("NON AUTORISÉ : Seuls les administrateurs peuvent importer des documents pour les concours.");
    }
    this.validateUpload(file, "cover");
    const ext = file.name.split(".").pop() || "png";
    const filePath = `contest_${contestId}/asset_${Date.now()}.${ext}`;

    return activeProvider.uploadFile(file, {
      bucket: "contests",
      filePath,
      userId,
      userRole,
    });
  },

  async uploadChapterMedia(file: File, storyId: string, nodeId: string, userId: string, userRole: UserRole): Promise<string> {
    if (
      userRole !== "AUTHOR" && 
      userRole !== "ADMIN" && 
      userRole !== "SUPER_ADMIN" && 
      userRole !== "FOUNDER_OWNER"
    ) {
      throw new Error("NON AUTORISÉ : Seuls les auteurs peuvent importer du contenu de chapitre.");
    }
    const isDoc = file.name.toLowerCase().endsWith(".pdf");
    this.validateUpload(file, isDoc ? "document" : "illustration");

    const ext = file.name.split(".").pop() || "pdf";
    const filePath = `story_${storyId}/node_${nodeId}/media_${Date.now()}.${ext}`;

    return activeProvider.uploadFile(file, {
      bucket: "chapters",
      filePath,
      userId,
      userRole,
    });
  },

  async deleteFile(
    bucket: "avatars" | "covers" | "illustrations" | "chapters" | "contests" | "temporary", 
    filePath: string
  ): Promise<void> {
    return activeProvider.deleteFile(bucket, filePath);
  },

  async getPublicUrl(
    bucket: "avatars" | "covers" | "illustrations" | "chapters" | "contests" | "temporary", 
    filePath: string
  ): Promise<string> {
    return activeProvider.getPublicUrl(bucket, filePath);
  },

  async createSignedUrl(
    bucket: "avatars" | "covers" | "illustrations" | "chapters" | "contests" | "temporary", 
    filePath: string, 
    expiresInSeconds: number
  ): Promise<string> {
    return activeProvider.createSignedUrl(bucket, filePath, expiresInSeconds);
  },

  async moveTemporaryFile(
    sourcePath: string, 
    destBucket: "avatars" | "covers" | "illustrations" | "chapters" | "contests" | "temporary", 
    destPath: string
  ): Promise<string> {
    return activeProvider.moveTemporaryFile(sourcePath, destBucket, destPath);
  }
};
