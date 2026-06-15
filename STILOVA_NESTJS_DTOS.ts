import { 
  IsEmail, IsString, IsNotEmpty, IsEnum, IsArray, IsOptional, 
  IsBoolean, IsInt, IsUrl, MinLength, MaxLength, Min, Max, 
  ValidateNested, ArrayMinSize 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==========================================
// CENTRAL ENUMS
// ==========================================
export enum PreferredMode {
  READER = 'READER',
  AUTHOR = 'AUTHOR',
  BOTH = 'BOTH'
}

export enum UserRole {
  VISITOR = 'VISITOR',
  READER = 'READER',
  AUTHOR = 'AUTHOR',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum StoryStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum SortOption {
  POPULAR = 'popular',
  RECENT = 'recent',
  RATING = 'rating'
}

// ==========================================
// 1. AUTH MODULE DTOs
// ==========================================

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: "L'adresse email de connexion unique" })
  @IsEmail({}, { message: 'Adresse email mal formée.' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Doit contenir au moins 8 caractères, un chiffre, une majuscule.' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit comporter au moins 8 caractères.' })
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ enum: PreferredMode, default: PreferredMode.READER })
  @IsEnum(PreferredMode)
  preferredMode!: PreferredMode;

  @ApiProperty({ type: [String], example: ['ROMANCE', 'FANTASY'], description: 'Collection de genres favoris choisis à l\'inscription (minimum 3 requis).' })
  @IsArray()
  @ArrayMinSize(3, { message: 'Sélectionnez au moins 3 genres différents pour calibrer votre granger.' })
  @IsString({ each: true })
  genres!: string[];
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token à usage unique reçu par courrier transactionnel.' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ minLength: 8, example: 'NewStrongPassword456!' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword!: string;
}

export class Verify2faDto {
  @ApiProperty({ example: '123456', length: 6, description: 'Code TOTP généré par Google Authenticator ou assimilé.' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

// ==========================================
// 2. USERS MODULE DTOs
// ==========================================

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Kofi Amadou' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Conteur d\'Afrofuturisme explorant de nouveaux mondes.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional()
  @IsString()
  lang?: string;

  @ApiPropertyOptional({ example: 'CI' })
  @IsOptional()
  @IsString()
  country?: string;
}

// ==========================================
// 3. SETTINGS MODULE DTOs
// ==========================================

export class UpdatePrivacyDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  showLibrary!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  showFavorites!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  showHistory!: boolean;
}

// ==========================================
// 4. STORIES MODULE DTOs
// ==========================================

export class CreateStoryDto {
  @ApiProperty({ example: 'Les Ombres de Kourouman', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiProperty({ example: 'Une chronique immersive de la vallée de l\'or...', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ example: 'AFROFUTURISM' })
  @IsString()
  @IsNotEmpty()
  genre!: string;

  @ApiPropertyOptional({ type: [String], example: ['cyberpunk', 'traditional'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isInteractive?: boolean;

  @ApiPropertyOptional({ default: 'fr' })
  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateStoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isInteractive?: boolean;
}

// ==========================================
// 5. CHAPTERS MODULE DTOs
// ==========================================

export class CreateChapterDto {
  @ApiProperty({ example: 'story_uuid_123' })
  @IsString()
  @IsNotEmpty()
  storyId!: string;

  @ApiProperty({ example: 'Chapitre 1 : Les Rumeurs de la Cité' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Littérature ou structure JSON par blocs d\'écriture.' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRoot?: boolean;
}

export class UpdateChapterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;
}

// ==========================================
// 6. INTERACTIVE MODULE DTOs
// ==========================================

export class ChoiceDto {
  @ApiProperty({ example: 'chapter_source_1' })
  @IsString()
  @IsNotEmpty()
  sourceChapterId!: string;

  @ApiProperty({ example: 'chapter_dest_2' })
  @IsString()
  @IsNotEmpty()
  destinationChapterId!: string;

  @ApiProperty({ example: 'S\'introduire discrètement par la herse' })
  @IsString()
  @IsNotEmpty()
  text!: string;
}

// ==========================================
// 7. BOOKMARKS MODULE DTOs
// ==========================================

export class CreateBookmarkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  storyId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  chapterId!: string;

  @ApiProperty({ example: 45.2, description: 'Pourcentage ou ratio vertical de défilement' })
  @IsInt()
  @Min(0)
  @Max(100)
  scrollPosition!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  noteText?: string;
}

// ==========================================
// 8. COMMENTS MODULE DTOs
// ==========================================

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  storyId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  chapterId!: string;

  @ApiProperty({ example: 'Incroyable intrigue d\'Afrofuturisme, j\'en frissonne !', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content!: string;
}

// ==========================================
// 9. UNIVERS MODULE DTOs
// ==========================================

export class UniverseDto {
  @ApiProperty({ example: 'Cosmos d\'Or d\'Empire' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Règne de Kourouman au clair de saphir' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ example: 'https://cdn.stilova.com/blueprints/kourouman.png' })
  @IsOptional()
  @IsUrl()
  cosmosBlueprintUrl?: string;
}

// ==========================================
// 10. CONTESTS MODULE DTOs
// ==========================================

export class ContestDto {
  @ApiProperty({ example: 'Le Trophée des Griots 2026' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Écrire une saga africaine inspirée du fleuve.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '5 000 000 FCFA' })
  @IsString()
  @IsNotEmpty()
  reward!: string;

  @ApiProperty({ example: '2026-06-30T23:59:59Z' })
  @IsString()
  @IsNotEmpty()
  endAt!: string;
}

// ==========================================
// 11. AI MODULE DTOs
// ==========================================

export class AiPromptDto {
  @ApiProperty({ example: 'Un griot écrivant à la lueur des bougies' })
  @IsString()
  @IsNotEmpty()
  prompt!: string;
}

export class AiTextDto {
  @ApiProperty({ example: 'Il marchas ver la foret sacrer' })
  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class AiCoWriterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  contextText!: string;
}

// ==========================================
// 12. STANDARD PAGINATION METADATA DTOs
// ==========================================

export class MetaPaginationResponse {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 200 })
  total!: number;

  @ApiProperty({ example: 10 })
  totalPages!: number;
}
