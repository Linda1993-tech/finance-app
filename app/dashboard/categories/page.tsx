import { getCategories } from './actions'
import { CategoryList } from './category-list'
import { CreateCategoryForm } from './create-category-form'

export default async function CategoriesPage() {
  const categories = await getCategories()

  // Separate parent categories from subcategories
  const parentCategories = categories.filter((c) => !c.parent_id)
  const subcategories = categories.filter((c) => c.parent_id)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Categories
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Organize your transactions with custom categories
              </p>
            </div>
            <a
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create new category form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Create Category
              </h2>
              <CreateCategoryForm parentCategories={parentCategories} />
            </div>
          </div>

          {/* Categories list */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Your Categories ({categories.length})
                </h2>
              </div>
              <CategoryList
                categories={categories}
                parentCategories={parentCategories}
                subcategories={subcategories}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

