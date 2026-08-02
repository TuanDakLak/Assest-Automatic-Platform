import { Injectable } from '@nestjs/common';
import { NotebooklmRepository } from './notebooklm.repository';
import { CreateNotebooklmDto } from './dto/create-notebooklm.dto';
import { UpdateNotebooklmDto } from './dto/update-notebooklm.dto';

@Injectable()
export class NotebooklmService {
  constructor(private readonly repository: NotebooklmRepository) {}

  async create(createDto: CreateNotebooklmDto) {
    return this.repository.create(createDto);
  }

  async findAll() {
    return this.repository.findAll();
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }

  async update(id: string, updateDto: UpdateNotebooklmDto) {
    return this.repository.update(id, updateDto);
  }

  async remove(id: string) {
    return this.repository.remove(id);
  }
}
