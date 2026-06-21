import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

describe('AuthController', () => {
  let controller: AuthController
  let authService: jest.Mocked<AuthService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('register', () => {
    it('should call authService.register with the dto and return its result', async () => {
      const dto: RegisterDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password1!',
      }
      const expected = { message: 'User created successfully' }
      authService.register.mockResolvedValue(expected as any)

      const result = await controller.register(dto)

      expect(authService.register).toHaveBeenCalledWith(dto)
      expect(result).toEqual(expected)
    })
  })

  describe('login', () => {
    it('should call authService.login with the dto and return its result', async () => {
      const dto: LoginDto = {
        email: 'john@example.com',
        password: 'Password1!',
      }
      const expected = { accessToken: 'signed-jwt-token' }
      authService.login.mockResolvedValue(expected as any)

      const result = await controller.login(dto)

      expect(authService.login).toHaveBeenCalledWith(dto)
      expect(result).toEqual(expected)
    })
  })
})
