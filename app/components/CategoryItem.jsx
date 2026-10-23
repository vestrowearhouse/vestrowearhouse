"use client";

import Link from "next/link";
import { Plus, Minus } from "lucide-react";
import { useCategories } from "../context/CategoryContext";

const CategoryItem = ({ category, level = 0 }) => {
  const { toggleCategory, expandedCategories, closeSidebar } = useCategories();
  const categoryId = category.id || category._id;
  const isExpanded = expandedCategories[categoryId];
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  const paddingLeft = `${level * 20 + 16}px`;

  return (
    <div className="border-b border-gray-50 last:border-none">
      <div 
        className="flex items-center justify-between py-3 pr-4 transition-colors group"
        style={{ paddingLeft }}
      >
        <Link 
          href={`/category/${category.slug}`}
          onClick={() => closeSidebar && closeSidebar()}
          className={`flex-1 truncate transition-colors ${
            level === 0 ? 'font-semibold text-gray-800' : 'text-sm text-gray-600'
          } ${isExpanded ? 'text-blue-600' : 'hover:text-blue-600'}`}
        >
          {category.name}
        </Link>
        
        {hasSubcategories && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCategory(categoryId);
            }}
            className="ml-2 p-1.5 rounded-md bg-gray-50 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors flex-shrink-0"
          >
            {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
          </button>
        )}
      </div>

      <div 
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded && hasSubcategories ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden bg-gray-50/30">
          {category.subcategories && category.subcategories.map((subCategory) => (
            <CategoryItem 
              key={subCategory.id || subCategory._id}
              category={subCategory}
              level={level + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryItem;
