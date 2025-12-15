import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, X } from 'lucide-react';

interface FiltersProps {
  filters: {
    state: string;
    city: string;
    minPrice: string;
    maxPrice: string;
    tags: string[];
  };
  onFiltersChange: (filters: FiltersProps['filters']) => void;
  availableTags: { id: string; name: string; slug: string }[];
}

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function ListingFilters({ filters, onFiltersChange, availableTags }: FiltersProps) {
  const [open, setOpen] = useState(false);

  const updateFilter = (key: keyof typeof filters, value: string | string[]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleTag = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter(t => t !== tagId)
      : [...filters.tags, tagId];
    updateFilter('tags', newTags);
  };

  const clearFilters = () => {
    onFiltersChange({
      state: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      tags: [],
    });
  };

  const hasActiveFilters = filters.state || filters.city || filters.minPrice || filters.maxPrice || filters.tags.length > 0;

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select value={filters.state} onValueChange={(v) => updateFilter('state', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {STATES.map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Cidade</Label>
        <Input
          placeholder="Digite a cidade"
          value={filters.city}
          onChange={(e) => updateFilter('city', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Faixa de Preço</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Mín"
            value={filters.minPrice}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
          />
          <Input
            type="number"
            placeholder="Máx"
            value={filters.maxPrice}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <Badge
              key={tag.id}
              variant={filters.tags.includes(tag.id) ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Limpar filtros
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {filters.tags.length + (filters.state ? 1 : 0) + (filters.city ? 1 : 0) + (filters.minPrice || filters.maxPrice ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop filters */}
      <div className="hidden lg:block p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <FilterContent />
      </div>
    </>
  );
}
