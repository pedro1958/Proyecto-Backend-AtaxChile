import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeoService } from './geo.service';
import { Region } from './entities/region.entity';
import { Comuna } from './entities/comuna.entity';

const mockRegion: Region = {
  id: 1,
  nombre: 'Región Metropolitana de Santiago',
  comunas: [],
};

const mockComuna: Comuna = {
  id: 1,
  nombre: 'Santiago',
  regionId: 1,
  region: mockRegion,
};

describe('GeoService', () => {
  let service: GeoService;
  let regionRepo: jest.Mocked<Repository<Region>>;
  let comunaRepo: jest.Mocked<Repository<Comuna>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoService,
        {
          provide: getRepositoryToken(Region),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Comuna),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GeoService>(GeoService);
    regionRepo = module.get(getRepositoryToken(Region));
    comunaRepo = module.get(getRepositoryToken(Comuna));
  });

  // ── findAllRegiones ────────────────────────────────────────────────────────

  describe('findAllRegiones', () => {
    it('retorna lista de regiones', async () => {
      regionRepo.find.mockResolvedValue([mockRegion]);
      const result = await service.findAllRegiones();
      expect(result).toEqual([mockRegion]);
      expect(regionRepo.find).toHaveBeenCalledWith({
        order: { nombre: 'ASC' },
      });
    });
  });

  // ── findOneRegion ──────────────────────────────────────────────────────────

  describe('findOneRegion', () => {
    it('retorna la región con sus comunas', async () => {
      regionRepo.findOne.mockResolvedValue(mockRegion);
      const result = await service.findOneRegion(1);
      expect(result).toEqual(mockRegion);
    });

    it('lanza NotFoundException si no existe', async () => {
      regionRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneRegion(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── createRegion ───────────────────────────────────────────────────────────

  describe('createRegion', () => {
    it('crea y retorna una región', async () => {
      const dto = { nombre: 'Nueva Región' };
      regionRepo.create.mockReturnValue(mockRegion);
      regionRepo.save.mockResolvedValue(mockRegion);
      const result = await service.createRegion(dto);
      expect(result).toEqual(mockRegion);
      expect(regionRepo.create).toHaveBeenCalledWith(dto);
    });
  });

  // ── updateRegion ───────────────────────────────────────────────────────────

  describe('updateRegion', () => {
    it('actualiza y retorna la región', async () => {
      regionRepo.findOneBy.mockResolvedValue(mockRegion);
      regionRepo.save.mockResolvedValue({
        ...mockRegion,
        nombre: 'Modificada',
      });
      const result = await service.updateRegion(1, { nombre: 'Modificada' });
      expect(result.nombre).toBe('Modificada');
    });

    it('lanza NotFoundException si no existe', async () => {
      regionRepo.findOneBy.mockResolvedValue(null);
      await expect(service.updateRegion(99, { nombre: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findComunasByRegion ───────────────────────────────────────────────────

  describe('findComunasByRegion', () => {
    it('retorna comunas de una región', async () => {
      regionRepo.findOneBy.mockResolvedValue(mockRegion);
      comunaRepo.find.mockResolvedValue([mockComuna]);
      const result = await service.findComunasByRegion(1);
      expect(result).toEqual([mockComuna]);
    });

    it('lanza NotFoundException si la región no existe', async () => {
      regionRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findComunasByRegion(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── findOneComuna ─────────────────────────────────────────────────────────

  describe('findOneComuna', () => {
    it('retorna la comuna con su región', async () => {
      comunaRepo.findOne.mockResolvedValue(mockComuna);
      const result = await service.findOneComuna(1);
      expect(result).toEqual(mockComuna);
    });

    it('lanza NotFoundException si no existe', async () => {
      comunaRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneComuna(99)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── createComuna ──────────────────────────────────────────────────────────

  describe('createComuna', () => {
    it('crea y retorna una comuna', async () => {
      const dto = { nombre: 'Nueva Comuna', regionId: 1 };
      regionRepo.findOneBy.mockResolvedValue(mockRegion);
      comunaRepo.create.mockReturnValue(mockComuna);
      comunaRepo.save.mockResolvedValue(mockComuna);
      const result = await service.createComuna(dto);
      expect(result).toEqual(mockComuna);
    });

    it('lanza NotFoundException si la región no existe', async () => {
      regionRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.createComuna({ nombre: 'X', regionId: 99 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateComuna ──────────────────────────────────────────────────────────

  describe('updateComuna', () => {
    it('actualiza y retorna la comuna', async () => {
      comunaRepo.findOneBy.mockResolvedValue(mockComuna);
      comunaRepo.save.mockResolvedValue({
        ...mockComuna,
        nombre: 'Modificada',
      });
      const result = await service.updateComuna(1, { nombre: 'Modificada' });
      expect(result.nombre).toBe('Modificada');
    });

    it('lanza NotFoundException si la comuna no existe', async () => {
      comunaRepo.findOneBy.mockResolvedValue(null);
      await expect(service.updateComuna(99, { nombre: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza NotFoundException si la nueva región no existe', async () => {
      comunaRepo.findOneBy.mockResolvedValue(mockComuna);
      regionRepo.findOneBy.mockResolvedValue(null);
      await expect(service.updateComuna(1, { regionId: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
