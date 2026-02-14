
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Student, GradeEntry, AppreciationEntry, TutorValues, Bimestre, AcademicLoad } from '../types';

export const generateGlobalReportCard = (
  student: Student,
  bimestre: Bimestre,
  allCourses: AcademicLoad[], // Todos los cursos del grado
  allGrades: GradeEntry[],    // Todas las notas registradas
  appreciation: AppreciationEntry,
  tutorData: TutorValues
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const institutionalBlue = [87, 197, 213];
  const warningRed = [220, 38, 38];

  // --- PÁGINA 1: CONSOLIDADO DE TODAS LAS ÁREAS ---
  doc.setFillColor(87, 197, 213);
  doc.rect(0, 0, 297, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('I.E.P. VALORES Y CIENCIAS', 148.5, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text('LIBRETA DE INFORMACIÓN INTEGRAL - ' + bimestre.label.toUpperCase(), 148.5, 22, { align: 'center' });

  // Cuadro de datos del alumno
  doc.setDrawColor(200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, 35, 277, 15, 2, 2, 'FD');
  doc.setTextColor(50);
  doc.setFontSize(9);
  doc.text(`ALUMNO: ${student.fullName.toUpperCase()}`, 15, 44);
  doc.text(`GRADO/SECC: ${allCourses[0]?.gradeSection || 'N/A'}`, 180, 44);

  let currentY = 55;

  // Generar filas para todas las áreas y competencias
  const tableData: any[] = [];
  
  allCourses.forEach(course => {
    // Fila de Encabezado de Área
    tableData.push([
      { content: course.courseName.toUpperCase(), colSpan: 1, styles: { fillColor: [240, 249, 250], fontStyle: 'bold', textColor: [10, 100, 120] } },
      { content: '', styles: { fillColor: [240, 249, 250] } }
    ]);

    course.competencies.forEach(comp => {
      const gradeObj = allGrades.find(g => g.studentId === student.id && g.competencyId === comp.id);
      const grade = gradeObj?.grade || '';
      
      tableData.push([
        { content: `   • ${comp.name}`, styles: { cellPadding: { left: 8 } } },
        { 
          content: grade || 'SIN NOTA', 
          styles: { 
            halign: 'center', 
            fontStyle: 'bold',
            textColor: grade ? [0, 0, 0] : warningRed 
          } 
        }
      ]);
    });
  });

  (doc as any).autoTable({
    startY: currentY,
    margin: { left: 10, right: 10 },
    head: [['ÁREAS Y COMPETENCIAS CURRICULARES', 'LOGRO']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [70, 70, 70], textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 240 }, 1: { cellWidth: 37 } },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.cell.text[0] === 'SIN NOTA') {
        data.cell.styles.fillColor = [255, 230, 230];
      }
    }
  });

  doc.setFontSize(7);
  doc.setTextColor(180);
  doc.text('Página 1: Logros Académicos Consolidados', 148.5, 205, { align: 'center' });

  // --- PÁGINA 2: TUTORÍA Y FIRMAS (REVERSO) ---
  doc.addPage('landscape');
  
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, 297, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('TUTORÍA, CONDUCTA Y APRECIACIONES FINALES', 148.5, 8, { align: 'center' });

  // Comportamiento
  (doc as any).autoTable({
    startY: 20,
    margin: { left: 10, right: 10 },
    head: [['VALORACIÓN SOCIOEMOCIONAL Y CONDUCTUAL', 'CALIF.']],
    body: [
      ['CONDUCTA Y CONVIVENCIA ESCOLAR', tutorData.comportamiento || 'PENDIENTE'],
      ['VALORES Y ACTITUDES ANTE EL ÁREA', tutorData.tutoriaValores || 'PENDIENTE']
    ],
    headStyles: { fillColor: [245, 158, 11] },
    columnStyles: { 0: { cellWidth: 240 }, 1: { cellWidth: 37, halign: 'center', fontStyle: 'bold' } }
  });

  const nextY = (doc as any).lastAutoTable.finalY + 10;

  // Apreciación
  doc.setDrawColor(87, 197, 213);
  doc.roundedRect(10, nextY, 277, 60, 2, 2, 'S');
  doc.setFillColor(87, 197, 213);
  doc.rect(15, nextY - 3, 80, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(' CONCLUSIÓN DESCRIPTIVA DEL TUTOR ', 18, nextY + 1.5);

  doc.setTextColor(60);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  const commentText = appreciation.comment || 'El docente tutor aún no ha registrado la apreciación correspondiente a este bimestre.';
  const splitText = doc.splitTextToSize(commentText, 260);
  doc.text(splitText, 15, nextY + 12);

  // Leyenda de Calificación
  const leyY = 160;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('ESCALA DE CALIFICACIÓN:', 10, leyY);
  doc.setFont('helvetica', 'normal');
  doc.text('AD: Logro Destacado | A: Logro Previsto | B: En Proceso | C: En Inicio', 10, leyY + 5);

  // Firmas
  const sigY = 185;
  doc.setDrawColor(150);
  doc.line(40, sigY, 110, sigY);
  doc.line(187, sigY, 257, sigY);
  doc.setFontSize(8);
  doc.text('FIRMA DEL TUTOR', 75, sigY + 5, { align: 'center' });
  doc.text('SELLO Y FIRMA - DIRECCIÓN', 222, sigY + 5, { align: 'center' });

  doc.save(`LIBRETA_MAESTRA_${student.fullName.replace(/\s+/g, '_')}_${bimestre.id}.pdf`);
};
