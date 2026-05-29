import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    
    const projectId = params.id
    
    // Verify project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }
    
    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir este projeto' },
        { status: 403 }
      )
    }
    
    // Get all updates for this project to delete associated photos
    const { data: updates, error: updatesError } = await supabase
      .from('updates')
      .select('id')
      .eq('project_id', projectId)
    
    if (updatesError && updatesError.code !== 'PGRST116') { // PGRST116 means no rows returned
      return NextResponse.json(
        { error: 'Erro ao buscar atualizações' },
        { status: 500 }
      )
    }
    
    // Delete photos associated with updates
    if (updates && updates.length > 0) {
      // Get all photo storage paths for these updates
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('storage_path')
        .in('update_id', updates.map(update => update.id))
      
      if (photosError && photosError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: 'Erro ao buscar fotos' },
          { status: 500 }
        )
      }
      
      // Delete photo files from storage
      if (photos && photos.length > 0) {
        const storagePaths = photos.map(photo => photo.storage_path)
        const { error: storageError } = await supabase.storage
          .from('photos')
          .remove(storagePaths)
        
        if (storageError) {
          console.error('Erro ao excluir arquivos do storage:', storageError)
          // Continue anyway to delete database records
        }
      }
      
      // Delete photo records
      if (photos && photos.length > 0) {
        const { error: photoDbError } = await supabase
          .from('photos')
          .delete()
          .in('update_id', updates.map(update => update.id))
        
        if (photoDbError) {
          return NextResponse.json(
            { error: 'Erro ao excluir registros de fotos' },
            { status: 500 }
          )
        }
      }
    }
    
    // Delete updates
    if (updates && updates.length > 0) {
      const { error: updatesDeleteError } = await supabase
        .from('updates')
        .delete()
        .in('id', updates.map(update => update.id))
      
      if (updatesDeleteError) {
        return NextResponse.json(
          { error: 'Erro ao excluir atualizações' },
          { status: 500 }
        )
      }
    }
    
    // Delete stages
    const { error: stagesError } = await supabase
      .from('stages')
      .delete()
      .eq('project_id', projectId)
    
    if (stagesError) {
      return NextResponse.json(
        { error: 'Erro ao excluir etapas' },
        { status: 500 }
      )
    }
    
    // Finally, delete the project
    const { error: projectDeleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
    
    if (projectDeleteError) {
      return NextResponse.json(
        { error: 'Erro ao excluir projeto' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { message: 'Projeto excluído com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro inesperado na exclusão de projeto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}