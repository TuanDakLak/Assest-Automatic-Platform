import { Injectable } from '@nestjs/common';
import { JobsRepository } from './jobs.repository';
import { CreateJobsDto } from './dto/create-jobs.dto';
import { UpdateJobsDto } from './dto/update-jobs.dto';

@Injectable()
export class JobsService {
  constructor(private readonly repository: JobsRepository) {}

  async create(createDto: CreateJobsDto) {
    return this.repository.create(createDto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }

  async update(id: string, updateDto: UpdateJobsDto) {
    return this.repository.update(id, updateDto);
  }

  async remove(id: string) {
    return this.repository.remove(id);
  }
}
