import { Injectable } from '@nestjs/common';
import { SlidesRepository } from './slides.repository';
import { CreateSlidesDto } from './dto/create-slides.dto';
import { UpdateSlidesDto } from './dto/update-slides.dto';

@Injectable()
export class SlidesService {
  constructor(private readonly repository: SlidesRepository) {}

  async create(createDto: CreateSlidesDto) {
    return this.repository.create(createDto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }

  async update(id: string, updateDto: UpdateSlidesDto) {
    return this.repository.update(id, updateDto);
  }

  async remove(id: string) {
    return this.repository.remove(id);
  }
}
