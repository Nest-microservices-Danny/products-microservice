/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createProductDto: CreateProductDto) {
    return await this.prismaService.product.create({
      data: createProductDto,
    });
  }

  async findAll(pagination: PaginationDto) {
    const totalPage = await this.prismaService.product.count({
      where: { available: true },
    });
    const lastPage = Math.ceil(totalPage / (pagination.limit || 10));
    return {
      data: await this.prismaService.product.findMany({
        where: { available: true },
        skip: ((pagination.page ?? 1) - 1) * 10,
        take: pagination.limit,
      }),
      meta: {
        totalItems: totalPage,
        page: pagination.page || 1,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });
    if (!product || !product.available) {
      //TODO: Custom Exception for microservices change NotFoundException to RpcException
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Product with ID ${id} not found`,
      });
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;
    await this.findOne(id);
    return await this.prismaService.product.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.prismaService.product.update({
      where: { id },
      data: { available: false },
    });
    // return await this.prismaService.product.delete({
    //   where: { id },
    // });
  }
}
