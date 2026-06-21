import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { App } from 'supertest/types'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { UsersService } from '../src/modules/users/users.service'

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>

  const mockUser = {
    id: 'user-id-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    // bcrypt hash of "Password1!"
    password: '$2b$10$U9pjpfWHaNRJtH8B5q2EUuq7QmW8E0t9C3i4o1QwQ4Yh3xkN1Z2ZG',
    role: 'USER',
  }

  const usersServiceMock = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsersService)
      .useValue(usersServiceMock)
      .compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/auth/register (POST)', () => {
    const validBody = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'Password1!',
    }

    it('should register a new user and return 201', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null)
      usersServiceMock.create.mockResolvedValue(mockUser)

      const response = await request(app.getHttpServer()).post('/auth/register').send(validBody).expect(201)

      expect(response.body).toEqual({ message: 'User created successfully' })
      expect(usersServiceMock.create).toHaveBeenCalledTimes(1)
    })

    it('should return 409 when email is already in use', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(mockUser)

      await request(app.getHttpServer()).post('/auth/register').send(validBody).expect(409)

      expect(usersServiceMock.create).not.toHaveBeenCalled()
    })

    it('should return 400 when password does not meet complexity rules', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validBody, password: 'weak' })
        .expect(400)
    })

    it('should return 400 when email is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validBody, email: 'not-an-email' })
        .expect(400)
    })

    it('should return 400 when required fields are missing', async () => {
      await request(app.getHttpServer()).post('/auth/register').send({ email: 'john@example.com' }).expect(400)
    })
  })

  describe('/auth/login (POST)', () => {
    it('should return 200 and an access token for valid credentials', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(mockUser)

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'Password1!' })
        .expect(200)

      expect(response.body).toHaveProperty('accessToken')
      expect(typeof response.body.accessToken).toBe('string')
    })

    it('should return 401 when user does not exist', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null)

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'Password1!' })
        .expect(401)
    })

    it('should return 401 when password is incorrect', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(mockUser)

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'WrongPassword1!' })
        .expect(401)
    })

    it('should return 400 when body is malformed', async () => {
      await request(app.getHttpServer()).post('/auth/login').send({ email: 'not-an-email' }).expect(400)
    })
  })
})
