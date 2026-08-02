import { Injectable } from '@nestjs/common';
import { QualityRepository } from './quality.repository';
import { CreateQualityDto } from './dto/create-quality.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';

@Injectable()
export class QualityService {
  constructor(private readonly repository: QualityRepository) {}

  async create(createDto: CreateQualityDto) {
    return this.repository.create(createDto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }

  async update(id: string, updateDto: UpdateQualityDto) {
    return this.repository.update(id, updateDto);
  }

  async remove(id: string) {
    return this.repository.remove(id);
  }
}
