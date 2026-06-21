import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { UserRole } from '../users/enums/user-role.enum'

jest.mock('bcrypt')

describe('AuthService', () => {
  let service: AuthService
  let usersService: jest.Mocked<UsersService>
  let jwtService: jest.Mocked<JwtService>

  const mockUser = {
    id: 'user-id-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    role: UserRole.USER,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    usersService = module.get(UsersService)
    jwtService = module.get(JwtService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('register', () => {
    const registerDto: RegisterDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password1!',
    }

    it('should create a new user when email is not already in use', async () => {
      usersService.findByEmail.mockResolvedValue(null)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password')
      usersService.create.mockResolvedValue(mockUser as any)

      const result = await service.register(registerDto)

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email)
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10)
      expect(usersService.create).toHaveBeenCalledWith({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        email: registerDto.email,
        password: 'hashed-password',
      })
      expect(result).toEqual({ message: 'User created successfully' })
    })

    it('should throw ConflictException when email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any)

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException)
      expect(usersService.create).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john@example.com',
      password: 'Password1!',
    }

    it('should return an access token when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      jwtService.sign.mockReturnValue('signed-jwt-token')

      const result = await service.login(loginDto)

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email)
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password)
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        role: mockUser.role,
      })
      expect(result).toEqual({ accessToken: 'signed-jwt-token' })
    })

    it('should throw UnauthorizedException when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
      expect(jwtService.sign).not.toHaveBeenCalled()
    })
  })
})
