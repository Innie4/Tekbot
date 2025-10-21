import { PartialType } from '@nestjs/mapped-types';
import { CreateWidgetConfigDto } from './create-widget-config.dto';

export class UpdateWidgetConfigDto extends PartialType(CreateWidgetConfigDto) {}
