import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AtaxiaTypesService } from './ataxia-types.service';
import { AtaxiaType, GrupoAtaxia } from './entities/ataxia-type.entity';

const mockTipo: AtaxiaType = {
  id: 1,
  nombre: 'Ataxia de Friedreich',
  grupo: GrupoAtaxia.HEREDITARIA,
  descripcion: 'Ataxia hereditaria más frecuente',
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AtaxiaTypesService', () => {
  let service: AtaxiaTypesService;
  let repo: jest.Mocked<Repository<AtaxiaType>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AtaxiaTypesService,
        {
          provide: getRepositoryToken(AtaxiaType),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AtaxiaTypesService>(AtaxiaTypesService);
    repo = module.get(getRepositoryToken(AtaxiaType));
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('retorna todos los tipos activos sin filtro', async () => {
      repo.find.mockResolvedValue([mockTipo]);
      const result = await service.findAll();
      expect(result).toEqual([mockTipo]);
      expect(repo.find).toHaveBeenCalledWith({
        where: { activo: true },
        order: { grupo: 'ASC', nombre: 'ASC' },
      });
    });

    it('retorna tipos filtrados por grupo', async () => {
      repo.find.mockResolvedValue([mockTipo]);
      const result = await service.findAll(GrupoAtaxia.HEREDITARIA);
      expect(result).toEqual([mockTipo]);
      expect(repo.find).toHaveBeenCalledWith({
        where: { activo: true, grupo: GrupoAtaxia.HEREDITARIA },
        order: { grupo: 'ASC', nombre: 'ASC' },
      });
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('retorna el tipo si existe', async () => {
      repo.findOneBy.mockResolvedValue(mockTipo);
      const result = await service.findOne(1);
      expect(result).toEqual(mockTipo);
    });

    it('lanza NotFoundException si no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('crea y retorna un tipo de ataxia', async () => {
      const dto = {
        nombre: 'Ataxia de Friedreich',
        grupo: GrupoAtaxia.HEREDITARIA,
      };
      repo.create.mockReturnValue(mockTipo);
      repo.save.mockResolvedValue(mockTipo);
      const result = await service.create(dto);
      expect(result).toEqual(mockTipo);
      expect(repo.create).toHaveBeenCalledWith(dto);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('actualiza y retorna el tipo', async () => {
      repo.findOneBy.mockResolvedValue(mockTipo);
      repo.save.mockResolvedValue({ ...mockTipo, nombre: 'Nombre modificado' });
      const result = await service.update(1, { nombre: 'Nombre modificado' });
      expect(result.nombre).toBe('Nombre modificado');
    });

    it('lanza NotFoundException si no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update(99, { nombre: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── toggleStatus ──────────────────────────────────────────────────────────

  describe('toggleStatus', () => {
    it('desactiva un tipo activo', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockTipo, activo: true });
      repo.save.mockResolvedValue({ ...mockTipo, activo: false });
      const result = await service.toggleStatus(1);
      expect(result.activo).toBe(false);
    });

    it('activa un tipo desactivado', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockTipo, activo: false });
      repo.save.mockResolvedValue({ ...mockTipo, activo: true });
      const result = await service.toggleStatus(1);
      expect(result.activo).toBe(true);
    });

    it('lanza NotFoundException si no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.toggleStatus(99)).rejects.toThrow(NotFoundException);
    });
  });
});
