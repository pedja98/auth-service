import { IsEmail, IsOptional, IsString, Matches } from 'class-validator'
import { UserRole } from '../../users/enums/user-role.enum'

export class RegisterDto {
  @IsString()
  firstName!: string

  @IsString()
  lastName!: string

  @IsEmail()
  email!: string

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'password must be longer than or equal to 8 characters, must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
  })
  password!: string

  @IsOptional()
  @IsString()
  role?: UserRole
}
