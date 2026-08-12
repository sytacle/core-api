import {
    IsEmail,
    IsString,
    IsNotEmpty,
    IsOptional,
    MinLength,
    MaxLength,
    Matches,
} from "class-validator";

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(64)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: "Password must contain uppercase, lowercase, and a number",
    })
    password!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    givenName!: string;

    @IsString()
    @IsOptional()
    @MaxLength(64)
    middleName?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    familyName!: string;

    // ISO date (YYYY-MM-DD). Optional on the API; required by the sign-up UI.
    @IsString()
    @IsOptional()
    birthdate?: string;

    @IsString()
    @IsOptional()
    @MaxLength(64)
    displayName?: string;
}
